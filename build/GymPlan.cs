using System;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

[assembly: AssemblyTitle("Weekly Workout Schedule")]
[assembly: AssemblyProduct("Weekly Workout Schedule")]
[assembly: AssemblyVersion("1.1.0.0")]

static class Program
{
    static string BinDir;

    [STAThread]
    static void Main()
    {
        string root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "WeeklyWorkoutSchedule");
        BinDir = Path.Combine(root, "bin");
        Directory.CreateDirectory(BinDir);
        Directory.CreateDirectory(Path.Combine(root, "site"));

        // Unpack embedded payload next to the per-user data folder (refreshed every launch).
        Extract("Microsoft.Web.WebView2.Core.dll", BinDir);
        Extract("Microsoft.Web.WebView2.WinForms.dll", BinDir);
        Extract("WebView2Loader.dll", BinDir);
        Extract("index.html", Path.Combine(root, "site"));

        AppDomain.CurrentDomain.AssemblyResolve += (s, e) =>
        {
            string file = Path.Combine(BinDir, new AssemblyName(e.Name).Name + ".dll");
            return File.Exists(file) ? Assembly.LoadFrom(file) : null;
        };

        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(MainWindow.Create(root, BinDir));
    }

    static void Extract(string name, string dir)
    {
        using (Stream s = Assembly.GetExecutingAssembly().GetManifestResourceStream(name))
        {
            string target = Path.Combine(dir, name);
            try
            {
                using (FileStream f = File.Create(target)) s.CopyTo(f);
            }
            catch (IOException) { /* file in use by another running instance; keep existing copy */ }
        }
    }
}

// Kept in a separate class so WebView2 types load only after AssemblyResolve is registered.
static class MainWindow
{
    public static Form Create(string root, string binDir)
    {
        var form = new Form();
        form.Text = "Weekly Workout Schedule";
        form.Width = 1000;
        form.Height = 900;
        form.StartPosition = FormStartPosition.CenterScreen;
        form.BackColor = Color.FromArgb(0xE9, 0xEC, 0xEF);
        try { form.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }

        Microsoft.Web.WebView2.Core.CoreWebView2Environment.SetLoaderDllFolderPath(binDir);

        var web = new Microsoft.Web.WebView2.WinForms.WebView2();
        web.Dock = DockStyle.Fill;
        web.CreationProperties = new Microsoft.Web.WebView2.WinForms.CoreWebView2CreationProperties
        {
            UserDataFolder = Path.Combine(root, "data")
        };
        form.Controls.Add(web);

        web.CoreWebView2InitializationCompleted += async (s, e) =>
        {
            if (!e.IsSuccess)
            {
                MessageBox.Show(
                    "Could not start Microsoft Edge WebView2.\n\nInstall the WebView2 Runtime from:\nhttps://go.microsoft.com/fwlink/p/?LinkId=2124703\n\n" + e.InitializationException.Message,
                    "Weekly Workout Schedule", MessageBoxButtons.OK, MessageBoxIcon.Error);
                form.Close();
                return;
            }
            var core = web.CoreWebView2;
            core.Settings.AreDevToolsEnabled = false;
            core.Settings.IsStatusBarEnabled = false;
            core.SetVirtualHostNameToFolderMapping("gymplan.local", Path.Combine(root, "site"),
                Microsoft.Web.WebView2.Core.CoreWebView2HostResourceAccessKind.Allow);
            // Open external links in the default browser instead of a popup window.
            core.NewWindowRequested += (s2, e2) =>
            {
                e2.Handled = true;
                try { System.Diagnostics.Process.Start(e2.Uri); } catch { }
            };
            // Saved data lives in a JSON file outside the app, so updates never touch it.
            await core.AddScriptToExecuteOnDocumentCreatedAsync(DataFile.BridgeScript());
            core.WebMessageReceived += (s2, e2) =>
            {
                string msg;
                try { msg = e2.TryGetWebMessageAsString(); } catch { return; }
                DataFile.Save(msg);
            };
            core.Navigate("https://gymplan.local/index.html");
        };

        form.Load += (s, e) => { var t = web.EnsureCoreWebView2Async(); };
        return form;
    }
}

// Keeps everything the user enters in Documents\Weekly Workout Schedule\my-data.json.
// The page mirrors its localStorage into this file; on every launch the file is loaded back first.
static class DataFile
{
    public static readonly string Folder = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "Weekly Workout Schedule");
    public static readonly string FilePath = Path.Combine(Folder, "my-data.json");
    static string Backup { get { return FilePath + ".bak"; } }

    static string Read()
    {
        foreach (string f in new[] { FilePath, Backup })
        {
            try
            {
                if (!File.Exists(f)) continue;
                string text = File.ReadAllText(f, System.Text.Encoding.UTF8).Trim();
                if (text.StartsWith("{")) return text;
            }
            catch { }
        }
        return null;
    }

    public static void Save(string json)
    {
        if (json == null || !json.TrimStart().StartsWith("{") || json.Length > 20000000) return;
        try
        {
            Directory.CreateDirectory(Folder);
            string tmp = FilePath + ".tmp";
            File.WriteAllText(tmp, json, new System.Text.UTF8Encoding(false));
            if (File.Exists(FilePath)) File.Replace(tmp, FilePath, Backup);
            else File.Move(tmp, FilePath);
        }
        catch { /* never crash the app over a save; the next change retries */ }
    }

    static string JsString(string s)
    {
        if (s == null) return "null";
        var sb = new System.Text.StringBuilder("\"");
        foreach (char c in s)
        {
            if (c == '"' || c == '\\') sb.Append('\\').Append(c);
            else if (c < 0x20 || c == (char)0x2028 || c == (char)0x2029 || c == '<') sb.AppendFormat("\\u{0:x4}", (int)c);
            else sb.Append(c);
        }
        return sb.Append('"').ToString();
    }

    public static string BridgeScript()
    {
        return @"(function(){
  var raw=" + JsString(Read()) + @", file=" + JsString(FilePath) + @";
  var ls=window.localStorage, host=window.chrome&&window.chrome.webview;
  if(!ls||!host)return;
  window.__dataFile=file;
  var data=null; try{data=raw?JSON.parse(raw):null}catch(e){}
  if(data&&data.values){
    for(var i=ls.length-1;i>=0;i--){var k=ls.key(i);if(k&&k.indexOf('mf-')===0)ls.removeItem(k);}
    Object.keys(data.values).forEach(function(k){ls.setItem(k,JSON.stringify(data.values[k]));});
  }
  function snapshot(){
    var v={};
    for(var i=0;i<ls.length;i++){var k=ls.key(i);if(k.indexOf('mf-')!==0)continue;
      var s=ls.getItem(k);try{v[k]=JSON.parse(s)}catch(e){v[k]=s}}
    host.postMessage(JSON.stringify({app:'Weekly Workout Schedule',savedAt:new Date().toISOString(),values:v},null,2));
  }
  var queued=false; function queue(){if(queued)return;queued=true;Promise.resolve().then(function(){queued=false;snapshot();});}
  var set=Storage.prototype.setItem, rem=Storage.prototype.removeItem, clr=Storage.prototype.clear;
  Storage.prototype.setItem=function(k,v){set.call(this,k,v);if(this===ls)queue();};
  Storage.prototype.removeItem=function(k){rem.call(this,k);if(this===ls)queue();};
  Storage.prototype.clear=function(){clr.call(this);if(this===ls)queue();};
  if(!data)queue();
})();";
    }
}
