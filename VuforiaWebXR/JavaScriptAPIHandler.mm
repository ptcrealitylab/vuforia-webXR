//
//  JavaScriptAPIHandler.m
//  Vuforia Spatial Toolbox
//
//  Created by Benjamin Reynolds on 7/18/18.
//  Copyright © 2018 PTC. All rights reserved.
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//

#import "JavaScriptAPIHandler.h"
#import <UIKit/UIKit.h>
#import "ARManager.h"
#import <AudioToolbox/AudioToolbox.h>
#import <sys/utsname.h>

@implementation JavaScriptAPIHandler {
//    NSString* matrixStreamCallback;
    NSString* speechCallback;
    bool vuforiaRunning;
}

- (id)initWithDelegate:(id<JavaScriptCallbackDelegate>)newDelegate
{
    if (self = [super init]) {
        delegate = newDelegate;
    }
    return self;
}

#pragma mark -


// check if vuforia is ready and fires a callback once that's the case
- (void)getVuforiaReady:(NSString *)callback
{
    __block JavaScriptAPIHandler *blocksafeSelf = self; // https://stackoverflow.com/a/5023583/1190267

    [[ARManager sharedManager] startARWithCompletionHandler:^{
        [blocksafeSelf->delegate callJavaScriptCallback:callback withArguments:nil]; // notify the javascript that vuforia has finished loading
    }];
}

- (void)getProjectionMatrix:(NSString *)callback
{
    __block JavaScriptAPIHandler *blocksafeSelf = self; // https://stackoverflow.com/a/5023583/1190267
    
    [[ARManager sharedManager] getProjectionMatrixStringWithCompletionHandler:^(NSString *projectionMatrixString) {
        [blocksafeSelf->delegate callJavaScriptCallback:callback withArguments:@[projectionMatrixString]];
    }];
}

- (void)getMatrixStream:(NSString *)callback
{
    __block JavaScriptAPIHandler *blocksafeSelf = self; // https://stackoverflow.com/a/5023583/1190267
        
    [[ARManager sharedManager] setMatrixCompletionHandler:^(NSArray *visibleMarkers) {
        
        NSString* javaScriptObject = @"{";
        
        // add each marker's name:matrix pair to the object
        if (visibleMarkers.count > 0) {
            for (int i = 0; i < visibleMarkers.count; i++) {
                NSDictionary* thisMarker = visibleMarkers[i];
                NSString* markerName = thisMarker[@"name"];
                NSString* markerMatrix = thisMarker[@"modelViewMatrix"];

                javaScriptObject = [javaScriptObject stringByAppendingString:[NSString stringWithFormat:@"'%@': %@,", markerName, markerMatrix]];
            }
            javaScriptObject = [javaScriptObject substringToIndex:javaScriptObject.length-1]; // remove last comma character before closing the object
        }
        javaScriptObject = [javaScriptObject stringByAppendingString:@"}"];
        
        [blocksafeSelf->delegate callJavaScriptCallback:callback withArguments:@[javaScriptObject]];
        
//        NSLog(@"Found object markers: %@", visibleMarkers);
    }];
}

- (void)getCameraMatrixStream:(NSString *)callback
{
    __block JavaScriptAPIHandler *blocksafeSelf = self; // https://stackoverflow.com/a/5023583/1190267
    
    [[ARManager sharedManager] setCameraMatrixCompletionHandler:^(NSDictionary *cameraMarker) {
        NSString* cameraMatrix = cameraMarker[@"modelViewMatrix"];
        [blocksafeSelf->delegate callJavaScriptCallback:callback withArguments:@[cameraMatrix]];
    }];
}

- (void)setPause
{
    [[ARManager sharedManager] pauseCamera];
}

- (void)setResume
{
    [[ARManager sharedManager] resumeCamera];
}

@end
