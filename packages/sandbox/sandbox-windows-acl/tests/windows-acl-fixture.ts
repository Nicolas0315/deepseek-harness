/** Child-local native permissions for Windows ACL fixtures. */
const nativeFixture = `
$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;
public static class DshAclFixture {
  [StructLayout(LayoutKind.Sequential)] struct Luid { public uint Low; public int High; }
  [StructLayout(LayoutKind.Sequential)] struct Privilege { public uint Count; public Luid Id; public uint Attributes; }
  [DllImport("kernel32.dll")] static extern IntPtr GetCurrentProcess();
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
  [DllImport("kernel32.dll", SetLastError=true)] static extern IntPtr LocalFree(IntPtr memory);
  [DllImport("advapi32.dll", SetLastError=true)] static extern bool OpenProcessToken(IntPtr process,uint access,out IntPtr token);
  [DllImport("advapi32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern bool LookupPrivilegeValueW(string system,string name,out Luid id);
  [DllImport("advapi32.dll", SetLastError=true)] static extern bool AdjustTokenPrivileges(IntPtr token,bool all,ref Privilege state,uint size,IntPtr previous,IntPtr needed);
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern SafeFileHandle CreateFileW(string path,uint access,uint share,IntPtr security,uint disposition,uint flags,IntPtr template);
  [DllImport("advapi32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern bool ConvertStringSecurityDescriptorToSecurityDescriptorW(string text,uint revision,out IntPtr descriptor,IntPtr length);
  [DllImport("advapi32.dll", SetLastError=true)] static extern bool GetSecurityDescriptorDacl(IntPtr descriptor,out bool present,out IntPtr dacl,out bool defaulted);
  [DllImport("advapi32.dll", CharSet=CharSet.Unicode)] static extern uint SetNamedSecurityInfoW(string path,int kind,uint information,IntPtr owner,IntPtr group,IntPtr dacl,IntPtr sacl);
  public static void DisablePrivileges() {
    IntPtr token;
    if(!OpenProcessToken(GetCurrentProcess(),0x28,out token)) throw new Win32Exception();
    try {
      foreach(string name in new[]{"SeBackupPrivilege","SeRestorePrivilege","SeTakeOwnershipPrivilege"}) {
        Luid id;
        if(!LookupPrivilegeValueW(null,name,out id)) throw new Win32Exception();
        var state=new Privilege{Count=1,Id=id,Attributes=0};
        if(!AdjustTokenPrivileges(token,false,ref state,0,IntPtr.Zero,IntPtr.Zero)) throw new Win32Exception();
        // ERROR_NOT_ALL_ASSIGNED means this token lacks the privilege already.
        int error=Marshal.GetLastWin32Error();
        if(error!=0 && error!=1300) throw new Win32Exception(error);
      }
    } finally { CloseHandle(token); }
  }
  public static bool HasAccess(string path,uint access) {
    using(var handle=CreateFileW(path,access,7,IntPtr.Zero,3,0x02200000,IntPtr.Zero)) {
      if(!handle.IsInvalid) return true;
      int error=Marshal.GetLastWin32Error();
      if(error==5) return false;
      throw new Win32Exception(error);
    }
  }
  public static void SetDacl(string path,string sddl,bool protect) {
    IntPtr descriptor;
    if(!ConvertStringSecurityDescriptorToSecurityDescriptorW(sddl,1,out descriptor,IntPtr.Zero)) throw new Win32Exception();
    try {
      bool present,defaulted; IntPtr dacl;
      if(!GetSecurityDescriptorDacl(descriptor,out present,out dacl,out defaulted) || !present || dacl==IntPtr.Zero) throw new InvalidOperationException("Fixture DACL missing");
      uint error=SetNamedSecurityInfoW(path,1,4u|(protect?0x80000000u:0x20000000u),IntPtr.Zero,IntPtr.Zero,dacl,IntPtr.Zero);
      if(error!=0) throw new Win32Exception((int)error);
    } finally { LocalFree(descriptor); }
  }
}
'@
[DshAclFixture]::DisablePrivileges()
`

/**
 * Run ACL observations without backup, restore or take-ownership bypasses.
 * The privilege changes affect only the new fixture PowerShell process.
 * @param command - PowerShell code run after the native fixture helpers load.
 * @returns one command suitable for a private PowerShell child.
 */
export function aclFixtureCommand(command: string): string {
  return `${nativeFixture}\n${command}`
}
