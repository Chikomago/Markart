#import <AppKit/AppKit.h>

void markart_show_unsaved_alert(void *windowPointer, const char *title, const char *message,
                                const char *saveLabel, const char *cancelLabel, const char *discardLabel, bool dark,
                                void (*completion)(int, void *), void *context) {
    NSWindow *window = (__bridge NSWindow *)windowPointer;
    if (!window) { completion(0, context); return; }
    NSAlert *alert = [[NSAlert alloc] init];
    alert.window.appearance = [NSAppearance appearanceNamed:dark ? NSAppearanceNameDarkAqua : NSAppearanceNameAqua];
    alert.alertStyle = NSAlertStyleWarning;
    alert.messageText = [NSString stringWithUTF8String:title];
    alert.informativeText = [NSString stringWithUTF8String:message];
    [alert addButtonWithTitle:[NSString stringWithUTF8String:saveLabel]];
    NSButton *cancel = [alert addButtonWithTitle:[NSString stringWithUTF8String:cancelLabel]];
    cancel.keyEquivalent = @"\033";
    [alert addButtonWithTitle:[NSString stringWithUTF8String:discardLabel]];
    [alert beginSheetModalForWindow:window completionHandler:^(NSModalResponse response) {
        completion(response == NSAlertFirstButtonReturn ? 1 : response == NSAlertThirdButtonReturn ? 2 : 0, context);
    }];
}
