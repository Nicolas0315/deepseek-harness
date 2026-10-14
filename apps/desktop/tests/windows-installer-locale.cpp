// Exercises the production progress renderer with Japanese captions and a missing font fallback.
#define WIN32_LEAN_AND_MEAN
#define UNICODE
#include <windows.h>
#include <cwchar>

extern "C" __declspec(dllimport) HWND __cdecl InstallerShowProgress(HWND, HWND, BOOL, UINT,
    const WCHAR*, const WCHAR*, const WCHAR*, const WCHAR*, const WCHAR*, const WCHAR*, const WCHAR*);

static bool Render(const WCHAR* image, const WCHAR* face) {
    HINSTANCE instance = GetModuleHandleW(nullptr);
    HWND parent = CreateWindowExW(0, L"STATIC", L"Locale test", WS_POPUP,
        0, 0, 600, 600, nullptr, nullptr, instance, nullptr);
    if (!parent) return false;
    HWND stock = CreateWindowExW(0, L"STATIC", L"", WS_CHILD,
        0, 0, 600, 600, parent, nullptr, instance, nullptr);
    HWND source = CreateWindowExW(0, L"STATIC", L"", WS_CHILD,
        0, 0, 100, 20, stock, nullptr, instance, nullptr);
    const WCHAR* caption = L"\u6e96\u5099\u4e2d %d%%";
    HWND progress = stock && source ? InstallerShowProgress(parent, source, FALSE, 96, image,
        caption, caption, caption, caption, caption, face) : nullptr;
    WCHAR actual[160] = {};
    if (progress) {
        SendMessageW(progress, WM_PAINT, 0, 0);
        GetWindowTextW(progress, actual, ARRAYSIZE(actual));
    }
    const bool rendered = progress && wcsstr(actual, L"\u6e96\u5099\u4e2d ") == actual
        && wcschr(actual, L'%') != nullptr;
    DestroyWindow(parent);
    return rendered;
}

int wmain(int argc, WCHAR** argv) {
    if (argc != 2) return 1;
    if (!Render(argv[1], L"Yu Gothic UI")) return 2;
    if (!Render(argv[1], L"DSH deliberately absent font")) return 3;
    return 0;
}
