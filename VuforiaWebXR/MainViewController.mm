//
//  ViewController.m
//  Vuforia Spatial Toolbox
//
//  Created by Benjamin Reynolds on 7/2/18.
//  Copyright © 2018 PTC. All rights reserved.
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//

#import "MainViewController.h"
#import "REWebView.h"
#import "ARManager.h"

@implementation MainViewController
{
    UILabel* loadingLabel;
}

- (void)viewDidLoad {
    
    [super viewDidLoad];
    
    // set up web view
    
    self.webView = [[REWebView alloc] initWithDelegate:self];
    [self.webView addObserver:self forKeyPath:@"loading" options:NSKeyValueObservingOptionOld | NSKeyValueObservingOptionNew context:nil];
    
    [self.webView loadHTMLFile:@"index" fromDirectory:@"userinterface"];
    
    [self performSelector:@selector(checkLoadingForTimeout) withObject:nil afterDelay:10.0f];
    
    [self.view addSubview:self.webView];
    
    [self showLoadingLabel];
    
    // set up javascript API handler
    
    self.apiHandler = [[JavaScriptAPIHandler alloc] initWithDelegate:self];
    
    // set this main view controller as the container for the AR view
    
    [[ARManager sharedManager] setContainingViewController:self];
}

- (void)showLoadingLabel
{
    [[self getLoadingLabel] setHidden:NO];
    [self.view bringSubviewToFront:[self getLoadingLabel]];
}

- (void)hideLoadingLabel
{
    [[self getLoadingLabel] setHidden:YES];
}

- (UILabel *)getLoadingLabel
{
    if (loadingLabel == nil) {
        loadingLabel = [[UILabel alloc] initWithFrame:CGRectMake(20, 20, 200, 30)];
        [loadingLabel setText:@"Loading..."];
        [loadingLabel setTextColor:[UIColor whiteColor]];
        [self.view addSubview:loadingLabel];
    }
    return loadingLabel;
}

- (void)checkLoadingForTimeout
{
    NSLog(@"Check if loading did timeout...");
    NSLog(@"Is Web View loading? %@", (self.webView.loading ? @"TRUE" : @"FALSE"));
    NSLog(@"Web View URL: %@", self.webView.URL);
    
    if (self.webView.URL == NULL || self.webView.loading) {
        
        // reset the saved state and reload the interface from default server location
//        [self.webView loadInterfaceFromLocalServer];
    }
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey,id> *)change context:(void *)context
{
    if ([keyPath isEqualToString:@"loading"]) {
        bool oldLoading = [[change objectForKey:NSKeyValueChangeOldKey] boolValue];
        bool newLoading = [[change objectForKey:NSKeyValueChangeNewKey] boolValue];

        // disable callbacks anytime the webview is loading and re-enable whenever it finishes
        if (newLoading && !oldLoading) {
            self.callbacksEnabled = false;
            
            [self showLoadingLabel];
            
        } else if (!newLoading && oldLoading) {
            self.callbacksEnabled = true;
            
            [self hideLoadingLabel];
            
            NSLog(@"done loading... %@", self.webView.URL);
            if (self.webView.URL) {
                NSLog(@"Successfully loaded userinterface");
            } else {
                NSLog(@"Couldn't load userinterface. Try loading from local server.");
                
                // reset the saved state and reload the interface from default server location
//                [self.webView loadInterfaceFromLocalServer];
            }
        }
    }
}

- (void)webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)navigation withError:(NSError *)error
{
    NSLog(@"navigation did fail.... handle error by loading from local server...");
//    [self.webView loadInterfaceFromLocalServer];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

#pragma mark - JavaScript API Implementation

- (void)handleCustomRequest:(NSDictionary *)messageBody {
//    NSLog(@"Handle Request: %@", messageBody);
    
    NSString* functionName = messageBody[@"functionName"]; // required
    NSDictionary* arguments = messageBody[@"arguments"]; // optional
    // e.g. NSString* message = (NSString *)arguments[@"message"];
    NSString* callback = messageBody[@"callback"]; // optional
    
    if ([functionName isEqualToString:@"getVuforiaReady"]) {
        [self.apiHandler getVuforiaReady:callback];
        
    } else if ([functionName isEqualToString:@"getProjectionMatrix"]) {
        [self.apiHandler getProjectionMatrix:callback];
        
    } else if ([functionName isEqualToString:@"getMatrixStream"]) {
        [self.apiHandler getMatrixStream:callback];
        
    } else if ([functionName isEqualToString:@"getCameraMatrixStream"]) {
        [self.apiHandler getCameraMatrixStream:callback];
        
    } else if ([functionName isEqualToString:@"setPause"]) {
        [self.apiHandler setPause];
        
    } else if ([functionName isEqualToString:@"setResume"]) {
        [self.apiHandler setResume];
    }
}

#pragma mark - WKScriptMessageHandler Protocol Implementation

- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message
{
    [self handleCustomRequest: message.body];
}

#pragma mark - WKNavigaionDelegate Protocol Implementaion

- (void)webView:(WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler
{
    if (navigationAction.navigationType == WKNavigationTypeLinkActivated) {
        if (navigationAction.request.URL) {
            NSLog(@"%@", navigationAction.request.URL.host);
            // this is just an example of how to open url in safari instead of within the webview
            if ([navigationAction.request.URL.resourceSpecifier containsString:@"github.com"]) {
                if ([[UIApplication sharedApplication] canOpenURL:navigationAction.request.URL]) {
                    [[UIApplication sharedApplication] openURL:navigationAction.request.URL];
                    decisionHandler(WKNavigationActionPolicyCancel);
                }
            } else {
                decisionHandler(WKNavigationActionPolicyAllow);
            }
        }
    } else {
        decisionHandler(WKNavigationActionPolicyAllow);
    }
}

#pragma mark - JavaScriptCallbackDelegate Protocol Implementation

- (void)callJavaScriptCallback:(NSString *)callback withArguments:(NSArray *)arguments
{
//    if (!self.callbacksEnabled) return;

    if (callback) {
        if (arguments && arguments.count > 0) {
            for (int i=0; i < arguments.count; i++) {
                callback = [callback stringByReplacingOccurrencesOfString:[NSString stringWithFormat:@"__ARG%i__", (i+1)] withString:arguments[i]];
            }
        }
//        NSLog(@"Calling JavaScript callback: %@", callback);
        [self.webView runJavaScriptFromString:callback];
    }
}

@end
