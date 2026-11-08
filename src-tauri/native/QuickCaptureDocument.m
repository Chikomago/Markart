#import <AppKit/AppKit.h>

@interface MarkartQuickCaptureDocument : NSDocument
@property (nonatomic, copy) NSData *markdownData;
@end

@implementation MarkartQuickCaptureDocument
+ (BOOL)autosavesInPlace { return YES; }
- (NSData *)dataOfType:(NSString *)typeName error:(NSError **)outError {
    return self.markdownData ?: [NSData data];
}
- (BOOL)readFromData:(NSData *)data ofType:(NSString *)typeName error:(NSError **)outError {
    self.markdownData = data;
    return YES;
}
@end

static MarkartQuickCaptureDocument *quickDocument;
static NSWindow *quickWindow;
static NSButton *titleMenuButton;
static NSButton *centeredTitleButton;
static BOOL manualDirty;
static NSColor *titleDotColor;
static NSString *knownPath;
static id resizeObserver;
static id popoverObserver;
static id popoverDidShowObserver;

@interface MarkartQuickTitleClick : NSObject
- (void)openTitleMenu:(id)sender;
@end

@implementation MarkartQuickTitleClick
- (void)openTitleMenu:(id)sender { [titleMenuButton performClick:nil]; }
@end

static MarkartQuickTitleClick *titleClickHandler;

static void refreshTitleControls(void) {
    if (!quickDocument || !quickWindow) return;
    NSView *bar = [quickWindow standardWindowButton:NSWindowCloseButton].superview;
    if (!bar) return;
    NSTextField *title = nil;
    NSTextField *separator = nil;
    NSButton *menu = nil;
    for (NSView *view in bar.subviews) {
        if ([view isKindOfClass:NSTextField.class]) {
            NSTextField *field = (NSTextField *)view;
            if ([field.stringValue isEqualToString:quickDocument.displayName]) title = field;
            else if ([field.stringValue isEqualToString:@"—"]) separator = field;
        } else if ([view isKindOfClass:NSButton.class] &&
                   view != centeredTitleButton &&
                   view != [quickWindow standardWindowButton:NSWindowCloseButton] &&
                   view != [quickWindow standardWindowButton:NSWindowMiniaturizeButton] &&
                   view != [quickWindow standardWindowButton:NSWindowZoomButton]) {
            menu = (NSButton *)view;
        }
    }
    if (!title || !menu) return;
    titleMenuButton = menu;
    title.alphaValue = 0;
    if (separator) separator.alphaValue = 0;
    menu.alphaValue = 0;
    if (!centeredTitleButton || centeredTitleButton.superview != bar) {
        [centeredTitleButton removeFromSuperview];
        centeredTitleButton = [NSButton buttonWithTitle:@"" target:titleClickHandler action:@selector(openTitleMenu:)];
        centeredTitleButton.bordered = NO;
        centeredTitleButton.font = [NSFont systemFontOfSize:13 weight:NSFontWeightSemibold];
        centeredTitleButton.focusRingType = NSFocusRingTypeNone;
        if (@available(macOS 11.0, *)) {
            centeredTitleButton.image = [NSImage imageWithSystemSymbolName:@"chevron.down" accessibilityDescription:nil];
            centeredTitleButton.imagePosition = NSImageRight;
        }
        [bar addSubview:centeredTitleButton positioned:NSWindowAbove relativeTo:menu];
    }
    NSString *label = [NSString stringWithFormat:@"%@%@", quickDocument.displayName, manualDirty ? @"  ●" : @""];
    NSMutableAttributedString *styledTitle = [[NSMutableAttributedString alloc] initWithString:label attributes:@{NSFontAttributeName: centeredTitleButton.font, NSForegroundColorAttributeName: [NSColor labelColor]}];
    if (manualDirty) {
        NSRange dot = NSMakeRange(label.length - 1, 1);
        [styledTitle addAttributes:@{
            NSFontAttributeName: [NSFont systemFontOfSize:8 weight:NSFontWeightRegular],
            NSForegroundColorAttributeName: titleDotColor ?: [NSColor controlAccentColor],
            NSBaselineOffsetAttributeName: @2.5
        } range:dot];
    }
    centeredTitleButton.attributedTitle = styledTitle;
    centeredTitleButton.accessibilityLabel = [NSString stringWithFormat:@"%@%@", quickDocument.displayName, manualDirty ? @"，未保存" : @""];
    [centeredTitleButton sizeToFit];
    NSRect frame = centeredTitleButton.frame;
    frame.size.width += 12;
    frame.size.height = 24;
    frame.origin.x = round(NSMidX(bar.bounds) - frame.size.width / 2);
    frame.origin.y = round(NSMidY(bar.bounds) - frame.size.height / 2);
    centeredTitleButton.frame = frame;
}

static void scheduleTitleRefresh(void) {
    dispatch_async(dispatch_get_main_queue(), ^{ refreshTitleControls(); });
}

static void alignDocumentPopover(NSPopover *popover) {
    if (!quickWindow || ![NSStringFromClass(popover.contentViewController.class) containsString:@"TitlebarPopover"]) return;
    NSWindow *popup = popover.contentViewController.view.window;
    if (!popup) return;
    NSRect frame = popup.frame;
    CGFloat x = round(NSMidX(quickWindow.frame) - frame.size.width / 2);
    NSRect visible = quickWindow.screen.visibleFrame;
    x = MAX(NSMinX(visible), MIN(x, NSMaxX(visible) - frame.size.width));
    [popup setFrameOrigin:NSMakePoint(x, frame.origin.y)];
}

static void syncNativeSavePath(void) {
    NSString *path = quickDocument.fileURL.path;
    if (path.length && ![path isEqualToString:knownPath] && !quickDocument.isDocumentEdited) {
        knownPath = path;
        manualDirty = NO;
        scheduleTitleRefresh();
    }
}

void markart_quick_document_attach(void *windowPointer) {
    NSWindow *window = (__bridge NSWindow *)windowPointer;
    if (quickDocument || !window) return;
    quickWindow = window;
    manualDirty = NO;
    knownPath = nil;
    titleClickHandler = [[MarkartQuickTitleClick alloc] init];
    quickDocument = [[MarkartQuickCaptureDocument alloc] init];
    quickDocument.displayName = @"未命名";
    quickDocument.fileType = @"net.daringfireball.markdown";
    quickDocument.markdownData = [NSData data];
    NSWindowController *controller = [[NSWindowController alloc] initWithWindow:window];
    [quickDocument addWindowController:controller];
    [[NSDocumentController sharedDocumentController] addDocument:quickDocument];
    window.titleVisibility = NSWindowTitleVisible;
    resizeObserver = [[NSNotificationCenter defaultCenter] addObserverForName:NSWindowDidResizeNotification object:window queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification *note) {
        scheduleTitleRefresh();
    }];
    popoverObserver = [[NSNotificationCenter defaultCenter] addObserverForName:NSPopoverWillShowNotification object:nil queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification *note) {
        alignDocumentPopover(note.object);
    }];
    popoverDidShowObserver = [[NSNotificationCenter defaultCenter] addObserverForName:NSPopoverDidShowNotification object:nil queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification *note) {
        alignDocumentPopover(note.object);
    }];
    scheduleTitleRefresh();
}

void markart_quick_document_set_content(const char *content) {
    if (!quickDocument) return;
    NSView *titlebar = [quickWindow standardWindowButton:NSWindowCloseButton].superview;
    NSRect barFrame = titlebar.frame;
    NSView *titlebarContainer = titlebar.superview;
    NSRect titlebarFrame = titlebarContainer.frame;
    NSRect trafficFrames[3];
    for (NSInteger kind = NSWindowCloseButton; kind <= NSWindowZoomButton; kind++) {
        trafficFrames[kind] = [quickWindow standardWindowButton:kind].frame;
    }
    quickDocument.markdownData = [[NSString stringWithUTF8String:content ?: ""] dataUsingEncoding:NSUTF8StringEncoding];
    manualDirty = YES;
    [quickDocument updateChangeCount:NSChangeDone];
    // AppKit shrinks Tauri's 40pt overlay titlebar when the document becomes edited.
    titlebarContainer.frame = titlebarFrame;
    titlebar.frame = barFrame;
    for (NSInteger kind = NSWindowCloseButton; kind <= NSWindowZoomButton; kind++) {
        NSButton *button = [quickWindow standardWindowButton:kind];
        NSRect frame = button.frame;
        frame.origin.x = trafficFrames[kind].origin.x;
        button.frame = frame;
    }
    refreshTitleControls();
    scheduleTitleRefresh();
}

void markart_quick_document_set_dark_appearance(void *windowPointer, bool dark, const char *accent) {
    NSWindow *window = (__bridge NSWindow *)windowPointer;
    if (!window) return;
    unsigned red, green, blue;
    if (accent && sscanf(accent, "#%02x%02x%02x", &red, &green, &blue) == 3) {
        titleDotColor = [NSColor colorWithSRGBRed:red / 255.0 green:green / 255.0 blue:blue / 255.0 alpha:1];
    }
    window.appearance = [NSAppearance appearanceNamed:dark ? NSAppearanceNameDarkAqua : NSAppearanceNameAqua];
    refreshTitleControls();
    if (!window.isVisible) [window makeKeyAndOrderFront:nil];
}

void markart_quick_document_set_path(const char *path) {
    if (!quickDocument) return;
    NSString *name = [NSString stringWithUTF8String:path ?: ""];
    quickDocument.fileURL = name.length ? [NSURL fileURLWithPath:name] : nil;
    knownPath = name.length ? name : nil;
    manualDirty = NO;
    [quickDocument updateChangeCount:NSChangeCleared];
    scheduleTitleRefresh();
}

char *markart_quick_document_copy_path(void) {
    syncNativeSavePath();
    const char *path = quickDocument.fileURL.path.UTF8String;
    return path ? strdup(path) : NULL;
}

void markart_quick_document_detach(void) {
    if (!quickDocument) return;
    if (resizeObserver) [[NSNotificationCenter defaultCenter] removeObserver:resizeObserver];
    resizeObserver = nil;
    if (popoverObserver) [[NSNotificationCenter defaultCenter] removeObserver:popoverObserver];
    popoverObserver = nil;
    if (popoverDidShowObserver) [[NSNotificationCenter defaultCenter] removeObserver:popoverDidShowObserver];
    popoverDidShowObserver = nil;
    [centeredTitleButton removeFromSuperview];
    centeredTitleButton = nil;
    manualDirty = NO;
    knownPath = nil;
    [[NSDocumentController sharedDocumentController] removeDocument:quickDocument];
    quickDocument = nil;
    quickWindow = nil;
    titleMenuButton = nil;
    titleClickHandler = nil;
}

BOOL markart_quick_document_is_edited(void) {
    if (!quickDocument) return NO;
    syncNativeSavePath();
    return manualDirty;
}

void markart_quick_document_free_path(char *path) { free(path); }
