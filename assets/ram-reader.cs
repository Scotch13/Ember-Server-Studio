using System;
using System.Diagnostics;
using System.Threading;
class RamReader {
  static void Main(string[] args) {
    int pid;
    if(args.Length!=1 || !int.TryParse(args[0],out pid)) return;
    try {
      using(var process=Process.GetProcessById(pid)) {
        while(!process.HasExited) {
          process.Refresh();
          Console.WriteLine(process.WorkingSet64);Console.Out.Flush();
          Thread.Sleep(2000);
        }
      }
    } catch { }
  }
}
