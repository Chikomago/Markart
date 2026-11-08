#import <AppKit/AppKit.h>
#include <math.h>

void markart_quick_document_attach(void *windowPointer);
void markart_quick_document_set_content(const char *content);
void markart_quick_document_detach(void);

static CGFloat buttonY(NSWindow *window, NSWindowButton kind) {
    NSButton *button = [window standardWindowButton:kind];
    NSRect inWindow = [button.superview convertRect:button.frame toView:nil];
    return NSMidY([window convertRectToScreen:inWindow]);
}

static CGFloat buttonX(NSWindow *window, NSWindowButton kind) {
    NSButton *button = [window standardWindowButton:kind];
    NSRect inWindow = [button.superview convertRect:button.frame toView:nil];
    return NSMidX([window convertRectToScreen:inWindow]);
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
        [[NSRunLoop mainRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
        [window.contentView layoutSubtreeIfNeeded];
        markart_quick_document_attach((__bridge void *)window);
        [[NSRunLoop mainRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
        NSButton *close = [window standardWindowButton:NSWindowCloseButton];
        NSView *titlebarContainer = close.superview.superview;
        NSRect insetFrame = titlebarContainer.frame;
        insetFrame.size.height = NSHeight(close.frame) + 26;
        insetFrame.origin.y = NSHeight(window.frame) - insetFrame.size.height;
        titlebarContainer.frame = insetFrame;
        CGFloat spacing = [window standardWindowButton:NSWindowMiniaturizeButton].frame.origin.x - close.frame.origin.x;
        for (NSWindowButton kind = NSWindowCloseButton; kind <= NSWindowZoomButton; kind++) {
            NSButton *button = [window standardWindowButton:kind];
            NSRect frame = button.frame;
            frame.origin.x = 18 + kind * spacing;
            button.frame = frame;
        }
        CGFloat before[] = {buttonY(window, NSWindowCloseButton), buttonY(window, NSWindowMiniaturizeButton), buttonY(window, NSWindowZoomButton)};
        CGFloat beforeX[] = {buttonX(window, NSWindowCloseButton), buttonX(window, NSWindowMiniaturizeButton), buttonX(window, NSWindowZoomButton)};
        CGFloat beforeHeight = NSHeight(titlebarContainer.frame);

        markart_quick_document_set_content("a");
        CGFloat immediateY = buttonY(window, NSWindowCloseButton);
        if (fabs(before[0] - immediateY) > 0.5) {
            NSLog(@"FAIL: close button moved before the next frame from %.1f to %.1f", before[0], immediateY);
            return 1;
        }
        [window.contentView layoutSubtreeIfNeeded];
        [[NSRunLoop mainRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
        CGFloat after[] = {buttonY(window, NSWindowCloseButton), buttonY(window, NSWindowMiniaturizeButton), buttonY(window, NSWindowZoomButton)};
        CGFloat afterX[] = {buttonX(window, NSWindowCloseButton), buttonX(window, NSWindowMiniaturizeButton), buttonX(window, NSWindowZoomButton)};
        if (fabs(beforeHeight - NSHeight(titlebarContainer.frame)) > 0.5) {
            NSLog(@"FAIL: titlebar height changed from %.1f to %.1f", beforeHeight, NSHeight(titlebarContainer.frame));
            return 1;
        }
        for (int i = 0; i < 3; i++) {
            if (fabs(beforeX[i] - afterX[i]) > 0.5) {
                NSLog(@"FAIL: window button %d moved horizontally from %.1f to %.1f", i, beforeX[i], afterX[i]);
                return 1;
            }
            if (fabs(before[i] - after[i]) > 0.5) {
                NSLog(@"FAIL: window button %d moved vertically from %.1f to %.1f", i, before[i], after[i]);
                return 1;
            }
        }
        markart_quick_document_detach();
        NSLog(@"PASS: traffic lights remain vertically fixed after editing");
        return 0;
    }
}
