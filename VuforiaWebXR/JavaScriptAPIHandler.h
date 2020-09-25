//
//  JavaScriptAPIHandler.h
//  Vuforia Spatial Toolbox
//
//  Created by Benjamin Reynolds on 7/18/18.
//  Copyright © 2018 PTC. All rights reserved.
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//

#import <Foundation/Foundation.h>

@protocol JavaScriptCallbackDelegate

@required
- (void)callJavaScriptCallback:(NSString *)callback withArguments:(NSArray *)arguments;
@property (nonatomic) BOOL callbacksEnabled;

@end

@interface JavaScriptAPIHandler : NSObject {
    id<JavaScriptCallbackDelegate> delegate;
}

- (id)initWithDelegate:(id<JavaScriptCallbackDelegate>)newDelegate;

// JavaScript API Interface
- (void)getVuforiaReady:(NSString *)callback;
- (void)getProjectionMatrix:(NSString *)callback;
- (void)getMatrixStream:(NSString *)callback;
- (void)getCameraMatrixStream:(NSString *)callback;
- (void)setPause;
- (void)setResume;

@end
