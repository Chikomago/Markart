#import <AppKit/AppKit.h>
#include <math.h>

void markart_quick_document_attach(void *windowPointer);
void markart_quick_document_set_content(const char *content);
void markart_quick_document_set_dark_appearance(void *windowPointer, bool dark, const char *accent);
void markart_quick_document_detach(void);

static NSView *findTitle(NSView *view) {
    if (view.alphaValue > 0.01 && [[view accessibilityLabel] hasPrefix:@"未命名"]) return view;
    for (NSView *child in view.subviews) {
        NSView *found = findTitle(child);
        if (found) return found;
    }
    return nil;
}

static CGFloat titleY(NSWindow *window, NSView *title) {
    NSRect inWindow = [title.superview convertRect:title.frame toView:nil];
    return NSMidY([window convertRectToScreen:inWindow]);
}

int main(void) {
    @autoreleasepool {
        [NSApplication sharedApplication];
        NSWindow *window = [[NSWindow alloc] initWithContentRect:NSMakeRect(100, 100, 680, 560)
            styleMask:NSWindowStyleMaskTitled | NSWindowStyleMaskClosable |
                      NSWindowStyleMaskMiniaturizable | NSWindowStyleMaskResizable |
                      NSWindowStyleMaskFullSizeContentView
            backing:NSBackingStoreBuffered defer:NO];
        window.titlebarAppearsTransparent = YES;
        window.title = @"未命名";
        [window makeKeyAndOrderFront:nil];
        markart_quick_document_attach((__bridge void *)window);
        [[NSRunLoop mainRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
        NSButton *close = [window standardWindowButton:NSWindowCloseButton];
        NSView *titlebarContainer = close.superview.superview;
        NSRect insetFrame = titlebarContainer.frame;
        insetFrame.size.height = NSHeight(close.frame) + 26;
        insetFrame.origin.y = NSHeight(window.frame) - insetFrame.size.height;
        titlebarContainer.frame = insetFrame;
        markart_quick_document_set_dark_appearance((__bridge void *)window, false, "#52694b");
        NSView *bar = [window standardWindowButton:NSWindowCloseButton].superview;
        NSView *title = findTitle(bar);
        if (!title) { NSLog(@"FAIL: quick capture title is not accessible"); return 1; }
        CGFloat beforeY = titleY(window, title);

        markart_quick_document_set_content("a");
        [[NSRunLoop mainRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
        title = findTitle(bar);
        if (!title) { NSLog(@"FAIL: quick capture title disappeared after editing"); return 1; }
        CGFloat afterY = titleY(window, title);
        if (fabs(beforeY - afterY) > 0.5 || ![[title accessibilityLabel] containsString:@"未保存"]) {
            NSLog(@"FAIL: title moved from %.1f to %.1f or dirty dot did not appear; label=%@ bar=%@ container=%@ title=%@", beforeY, afterY, [title accessibilityLabel], NSStringFromRect(close.superview.frame), NSStringFromRect(titlebarContainer.frame), NSStringFromRect(title.frame));
            return 1;
        }
        markart_quick_document_detach();
        NSLog(@"PASS: title stays vertically fixed and shows unsaved state");
        return 0;
    }
}
