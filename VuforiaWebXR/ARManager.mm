//
//  ARManager.m
//  Vuforia Spatial Toolbox
//
//  Created by Benjamin Reynolds on 7/18/18.
//  Copyright © 2018 PTC. All rights reserved.
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//

#import "ARManager.h"

// import Vuforia
#import <Vuforia/Vuforia.h>
#import <Vuforia/TrackerManager.h>
#import <Vuforia/ObjectTracker.h>
#import <Vuforia/PositionalDeviceTracker.h>
#import <Vuforia/AreaTracker.h>
#import <Vuforia/AreaTarget.h>
#import <Vuforia/Trackable.h>
#import <Vuforia/DataSet.h>
#import <Vuforia/CameraDevice.h>
#import <Vuforia/Tool.h>
#import <Vuforia/StateUpdater.h>

#import <Vuforia/ObjectTargetResult.h>
#import <Vuforia/ImageTargetResult.h>
#import <Vuforia/DeviceTrackable.h>
#import <Vuforia/Anchor.h>
#import <Vuforia/ObjectTargetRaw.h>
#import <Vuforia/RuntimeImageSource.h>

#import "SampleApplicationUtils.h"

@implementation ARManager {
    bool isCameraPaused;
    const Vuforia::TrackableResult* deviceTrackableResult;
    
    BOOL disablePositionalDeviceTracker;
    BOOL disableAreaTargetTracker;
}

@synthesize didStartAR;
@synthesize eaglView;
@synthesize vapp;

+ (id)sharedManager
{
    static ARManager *sharedMyManager = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedMyManager = [[self alloc] init];
    });
    return sharedMyManager;
}

- (id)init
{
    if (self = [super init]) {
        self.markersFound = [NSMutableArray array];
        
        disablePositionalDeviceTracker = false;
        disableAreaTargetTracker = false;
    }
    return self;
}

// adds any targets to Vuforia that should always be present, e.g. the World Reference marker
- (void)addDefaultMarkers
{
    NSString* markerPath = [[NSBundle mainBundle] pathForResource:@"StonesAndChips" ofType:@"xml" inDirectory:@"ImageTargets"];
    [self addNewMarker:markerPath];
    
    NSString* markerPath2 = [[NSBundle mainBundle] pathForResource:@"Tarmac" ofType:@"xml" inDirectory:@"ImageTargets"];
    [self addNewMarker:markerPath2];
}

- (void)setContainingViewController:(UIViewController *)newContainingViewController
{
    if (!containingViewController) {
        containingViewController = newContainingViewController;
        self.vapp = [[SampleApplicationSession alloc] initWithDelegate:self];
        self.eaglView = [[ImageTargetsEAGLView alloc] initWithFrame:[[UIScreen mainScreen] bounds] appSession:self.vapp];
        [self.eaglView setBackgroundColor:UIColor.clearColor];
    } else {
        NSLog(@"You already set the containing view controller, it cannot be changed anymore");
    }
}

- (void)startARWithCompletionHandler:(CompletionHandler)completionHandler
{
    if (!self.vapp) {
        NSLog(@"You must setContainingViewController in order to start AR");
    }
    
    if (self.didStartAR) {
        NSLog(@"AR is already running... don't initialize it again...");
        
        if (arDoneCompletionHandler) {
            arDoneCompletionHandler();
        }
        return;
    }
    
    [containingViewController.view addSubview:self.eaglView];
    [containingViewController.view sendSubviewToBack:self.eaglView];
    
    arDoneCompletionHandler = completionHandler;
    
    // we use the iOS notification to pause/resume the AR when the application goes (or come back from) background
    [[NSNotificationCenter defaultCenter]
     addObserver:self
     selector:@selector(pauseAR)
     name:UIApplicationWillResignActiveNotification
     object:nil];
    
    [[NSNotificationCenter defaultCenter]
     addObserver:self
     selector:@selector(resumeAR)
     name:UIApplicationDidBecomeActiveNotification
     object:nil];
    
    [self.vapp initAR:Vuforia::GL_20 orientation:[[UIApplication sharedApplication] statusBarOrientation] cameraMode:Vuforia::CameraDevice::MODE_DEFAULT];
    self.didStartAR = true;
}

- (void) pauseAR {
    NSError * error = nil;
    if (![vapp pauseAR:&error]) {
        NSLog(@"Error pausing AR:%@", [error description]);
    }
}

- (void) resumeAR {
    NSError * error = nil;
    if(! [vapp resumeAR:&error]) {
        NSLog(@"Error resuming AR:%@", [error description]);
    }
    [eaglView updateRenderingPrimitives];
}

// Uses the new Vuforia 8.6.7 API to generate an image target using only a JPG image and XML metadata
- (BOOL)addNewMarkerFromImage:(NSString *)imagePath forObject:(NSString *)objectID targetWidthMeters:(float)targetWidthMeters;
{
    NSLog(@"addNewMarkerFromImage (%@)", imagePath);

    Vuforia::DataSet * dataSet = NULL;

    // Create a new empty data set.

    // Get the Vuforia tracker manager image tracker
    Vuforia::TrackerManager& trackerManager = Vuforia::TrackerManager::getInstance();
    Vuforia::ObjectTracker* objectTracker = static_cast<Vuforia::ObjectTracker*>(trackerManager.getTracker(Vuforia::ObjectTracker::getClassType()));

    if (NULL == objectTracker) {
       NSLog(@"ERROR: failed to get the ObjectTracker from the tracker manager");
    } else {
       dataSet = objectTracker->createDataSet();
       
       if (NULL != dataSet) {
           NSLog(@"INFO: successfully created empty data set");
           
           // Get the runtime image source
           Vuforia::RuntimeImageSource* runtimeImageSource = objectTracker->getRuntimeImageSource();

           // Load the data set from the given path.
           if (!runtimeImageSource->setFile([imagePath UTF8String], Vuforia::STORAGE_ABSOLUTE, targetWidthMeters, [objectID UTF8String]))
           {
               NSLog(@"ERROR: failed to load image file: %@", imagePath);
               return false;
           }
           
           if (!dataSet->createTrackable(runtimeImageSource)) {
               NSLog(@"ERROR: failed to create trackable for file: %@", imagePath);
               return false;
           }
           
           objectTracker->activateDataSet(dataSet);
       }
       else {
           NSLog(@"ERROR: failed to create data set");
       }
    }

    return dataSet != NULL;
}

- (BOOL)addNewMarker:(NSString *)markerPath
{
    NSLog(@"loadObjectTrackerDataSet (%@)", markerPath);
    
    // parse XML file at markerPath to see if it contains ImageTarget vs AreaTarget
    NSString *content = [NSString stringWithContentsOfFile:markerPath encoding:NSUTF8StringEncoding error:nil];
    BOOL isAreaTarget = [content containsString:@"AreaTarget"];

    Vuforia::DataSet * dataSet = NULL;
    
    // Get the Vuforia tracker manager image tracker
    Vuforia::TrackerManager& trackerManager = Vuforia::TrackerManager::getInstance();
    
    if (isAreaTarget) {
        
        Vuforia::AreaTracker* areaTracker = static_cast<Vuforia::AreaTracker*>(trackerManager.getTracker(Vuforia::AreaTracker::getClassType()));
        
        if (NULL == areaTracker) {
            NSLog(@"ERROR: failed to get the AreaTracker from the tracker manager");
        } else {
            dataSet = areaTracker->createDataSet();
            
            if (NULL != dataSet) {
                NSLog(@"INFO: successfully loaded data set");
                
                if (Vuforia::DataSet::exists([markerPath UTF8String], Vuforia::STORAGE_ABSOLUTE))
                {
                    if (dataSet->load([markerPath UTF8String], Vuforia::STORAGE_ABSOLUTE)) {
                        areaTracker->activateDataSet(dataSet);
                    } else {
                        NSLog(@"ERROR: failed to load data set");
                        areaTracker->destroyDataSet(dataSet);
                        dataSet = NULL;
                    }
                }
            }
            else {
                NSLog(@"ERROR: failed to create data set");
            }
        }
        
    } else {
        Vuforia::ObjectTracker* objectTracker = static_cast<Vuforia::ObjectTracker*>(trackerManager.getTracker(Vuforia::ObjectTracker::getClassType()));
        
        if (NULL == objectTracker) {
            NSLog(@"ERROR: failed to get the ObjectTracker from the tracker manager");
        } else {
            dataSet = objectTracker->createDataSet();
            
            if (NULL != dataSet) {
                NSLog(@"INFO: successfully loaded data set");
                
                // Load the data set from the app's resources location
                if (!dataSet->load([markerPath cStringUsingEncoding:NSASCIIStringEncoding], Vuforia::STORAGE_ABSOLUTE)) {
                    NSLog(@"ERROR: failed to load data set");
                    objectTracker->destroyDataSet(dataSet);
                    dataSet = NULL;

                } else {
                    objectTracker->activateDataSet(dataSet);
                }
            }
            else {
                NSLog(@"ERROR: failed to create data set");
            }
        }
    }
    
    return dataSet != NULL;
}

- (NSString *)getProjectionMatrixString
{
    Vuforia::Matrix44F projectionMatrix = [self.eaglView getProjectionMatrix];
    return [self stringFromMatrix44F:projectionMatrix];
}

- (void)getProjectionMatrixStringWithCompletionHandler:(MatrixStringCompletionHandler)completionHandler
{
    projectionMatrixCompletionHandler = completionHandler;
}

- (NSString *)stringFromMatrix34F:(Vuforia::Matrix34F)vuforiaMatrix
{
    return [NSString stringWithFormat:@"[%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf]",
            vuforiaMatrix.data[0],
            vuforiaMatrix.data[1],
            vuforiaMatrix.data[2],
            vuforiaMatrix.data[3],
            vuforiaMatrix.data[4],
            vuforiaMatrix.data[5],
            vuforiaMatrix.data[6],
            vuforiaMatrix.data[7],
            vuforiaMatrix.data[8],
            vuforiaMatrix.data[9],
            vuforiaMatrix.data[10],
            vuforiaMatrix.data[11]
            ];
}

- (NSString *)stringFromMatrix44F:(Vuforia::Matrix44F)vuforiaMatrix
{
    return [NSString stringWithFormat:@"[%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf,%lf]",
            vuforiaMatrix.data[0],
            vuforiaMatrix.data[1],
            vuforiaMatrix.data[2],
            vuforiaMatrix.data[3],
            vuforiaMatrix.data[4],
            vuforiaMatrix.data[5],
            vuforiaMatrix.data[6],
            vuforiaMatrix.data[7],
            vuforiaMatrix.data[8],
            vuforiaMatrix.data[9],
            vuforiaMatrix.data[10],
            vuforiaMatrix.data[11],
            vuforiaMatrix.data[12],
            vuforiaMatrix.data[13],
            vuforiaMatrix.data[14],
            vuforiaMatrix.data[15]
            ];
}

- (void)setMatrixCompletionHandler:(MarkerListCompletionHandler)completionHandler
{
    visibleMarkersCompletionHandler = completionHandler;
}

- (void)setCameraMatrixCompletionHandler:(MarkerCompletionHandler)completionHandler
{
    cameraMatrixCompletionHandler = completionHandler;
}

- (UIImage *)getCameraScreenshot
{
    return [self screenshotOfView:self.eaglView excludingViews:@[]];
}

- (GLchar *)getVideoBackgroundPixels
{
    return [self.eaglView getVideoBackgroundPixels];
}

- (CGSize)getCurrentARViewBoundsSize
{
    return [self.eaglView getCurrentARViewBoundsSize];
}

- (void)recordingStarted
{
    [self.eaglView recordingStarted];
}
- (void)recordingStopped
{
    [self.eaglView recordingStopped];
}

// Source: https://gist.github.com/brennanMKE/10010625
- (UIImage *)screenshotOfView:(UIView *)view excludingViews:(NSArray *)excludedViews {
    //    if (!floor(NSFoundationVersionNumber) > NSFoundationVersionNumber_iOS_6_1) {
    //        NSCAssert(FALSE, @"iOS 7 or later is required.");
    //    }
    
    // hide all excluded views before capturing screen and keep initial value
    NSMutableArray *hiddenValues = [@[] mutableCopy];
    for (NSUInteger index=0;index<excludedViews.count;index++) {
        [hiddenValues addObject:[NSNumber numberWithBool:((UIView *)excludedViews[index]).hidden]];
        ((UIView *)excludedViews[index]).hidden = TRUE;
    }
    
    UIImage *image = nil;
    UIGraphicsBeginImageContextWithOptions(view.bounds.size, view.opaque, 0.0);
    [view drawViewHierarchyInRect:view.bounds afterScreenUpdates:YES];
    
    image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    
    // reset hidden values
    for (NSUInteger index=0;index<excludedViews.count;index++) {
        ((UIView *)excludedViews[index]).hidden = [[hiddenValues objectAtIndex:index] boolValue];
    }
    
    // clean up
    hiddenValues = nil;
    
    return image;
}

- (void)pauseCamera
{
    Vuforia::CameraDevice::getInstance().stop();
    isCameraPaused = true;
}

- (void)resumeCamera
{
    Vuforia::CameraDevice::getInstance().start();
    isCameraPaused = false;
}

- (void)focusCamera
{
    Vuforia::CameraDevice::getInstance().setFocusMode(Vuforia::CameraDevice::FOCUS_MODE_TRIGGERAUTO);
}

#pragma mark - SampleApplicationControl Protocol Implementation

- (void) onInitARDone:(NSError *)initError
{
    NSLog(@"onInitARDone");
    
    if (initError == nil) {
        NSError * error = nil;
        
        bool didSimultaneousImagesSucceed = Vuforia::setHint(Vuforia::HINT_MAX_SIMULTANEOUS_IMAGE_TARGETS, 5);
        bool didSimultaneousObjectsSucceed = Vuforia::setHint(Vuforia::HINT_MAX_SIMULTANEOUS_OBJECT_TARGETS, 2);
        NSLog(@"Set simultaneouse image targets to 5 (%d), simultaneous object targets to 2 (%d)", didSimultaneousImagesSucceed, didSimultaneousObjectsSucceed);

        [self.vapp startAR:&error];
        
        [self.eaglView updateRenderingPrimitives];
        
        Vuforia::CameraDevice::getInstance().setFocusMode(Vuforia::CameraDevice::FOCUS_MODE_INFINITY);
        
        if (arDoneCompletionHandler) {
            arDoneCompletionHandler();
        }
        
        [self addDefaultMarkers];
                
    } else {
        NSLog(@"Error initializing AR:%@", [initError description]);
        dispatch_async( dispatch_get_main_queue(), ^{
            
            UIAlertController *uiAlertController =
            [UIAlertController alertControllerWithTitle:@"Error"
                                                message:[initError localizedDescription]
                                         preferredStyle:UIAlertControllerStyleAlert];
            UIAlertAction *defaultAction =
            [UIAlertAction actionWithTitle:@"OK"
                                     style:UIAlertActionStyleDefault
                                   handler:^(UIAlertAction *action) {
                                       [[NSNotificationCenter defaultCenter] postNotificationName:@"kDismissARViewController" object:nil];
                                   }];
            
            [uiAlertController addAction:defaultAction];
            [containingViewController presentViewController:uiAlertController animated:YES completion:nil];
        });
        self.didStartAR = false;
    }
}

- (bool) doInitTrackers
{
    NSLog(@"doInitTrackers");
    
    Vuforia::TrackerManager& trackerManager = Vuforia::TrackerManager::getInstance();

    // Initialize the object tracker
    Vuforia::Tracker* objectTracker = trackerManager.initTracker(Vuforia::ObjectTracker::getClassType());
    if (objectTracker == nullptr)
    {
        NSLog(@"Failed to initialize ObjectTracker.");
        return NO;
    }

    // initialize additional enabled trackers
    
    if (!disablePositionalDeviceTracker) {
        Vuforia::Tracker* deviceTracker = trackerManager.initTracker(Vuforia::PositionalDeviceTracker::getClassType());
        if (deviceTracker == nullptr)
        {
            NSLog(@"Failed to initialize DeviceTracker.");
            return NO;
        }
    }
    
    if (!disableAreaTargetTracker) {
        Vuforia::AreaTracker* areaTracker = static_cast<Vuforia::AreaTracker*>(trackerManager.initTracker(Vuforia::AreaTracker::getClassType()));
        if (areaTracker == nullptr)
        {
            NSLog(@"Failed to initialize AreaTracker");
        }
    }

    NSLog(@"Initialized trackers");
    return YES;
}

- (bool) doLoadTrackersData // TODO: add via api?
{
    // we don't need to load these here... we can do it one by one using javascript API
    NSLog(@"doLoadTrackersData");
    return true;
}

- (bool) doStartTrackers
{
    NSLog(@"doStartTrackers");

    Vuforia::TrackerManager& trackerManager = Vuforia::TrackerManager::getInstance();
    
    // Start object tracker
    Vuforia::Tracker* objectTracker = trackerManager.getTracker(Vuforia::ObjectTracker::getClassType());
    if(objectTracker == nullptr || !objectTracker->start())
    {
        NSLog(@"ERROR: Failed to start object tracker");
        return NO;
    }
    NSLog(@"Successfully started object tracker");
    
    // Start device tracker
    if (!disablePositionalDeviceTracker) {
        Vuforia::Tracker* deviceTracker = trackerManager.getTracker(Vuforia::PositionalDeviceTracker::getClassType());
        if (deviceTracker == nullptr || !deviceTracker->start())
        {
            NSLog(@"Failed to start DeviceTracker");
            return NO;
        }
        NSLog(@"Successfully started DeviceTracker");
    }

    // Start area target tracker
    if (!disableAreaTargetTracker) {
        NSLog(@"TODO: start area target tracker");
        Vuforia::AreaTracker* areaTracker = static_cast<Vuforia::AreaTracker*>(trackerManager.getTracker(Vuforia::AreaTracker::getClassType()));
        if (areaTracker == nullptr || !areaTracker->start())
        {
            NSLog(@"Failed to start Area Tracker");
            return NO;
        }
        NSLog(@"Successfully started Area Tracker");
    }

    return true;
}

- (bool) doStopTrackers
{
    Vuforia::TrackerManager& trackerManager = Vuforia::TrackerManager::getInstance();
    
    Vuforia::Tracker* objectTracker = trackerManager.getTracker(Vuforia::ObjectTracker::getClassType());
    if (objectTracker == 0) {
        NSLog(@"Error stopping object tracker");
        return false;
    }
    objectTracker->stop();
    
    if (!disablePositionalDeviceTracker) {
        Vuforia::Tracker* deviceTracker = trackerManager.getTracker(Vuforia::PositionalDeviceTracker::getClassType());
        if (deviceTracker == 0) {
            NSLog(@"Error stopping device tracker");
            return false;
        }
        deviceTracker->stop();
    }
    
    NSLog(@"doStopTrackers");
    return true;
}

- (BOOL) doUnloadTrackersData
{
    Vuforia::TrackerManager& trackerManager = Vuforia::TrackerManager::getInstance();
    
    // deactivate and destroy all the datasets for the object tracker
    Vuforia::ObjectTracker* objectTracker = static_cast<Vuforia::ObjectTracker*>(trackerManager.getTracker(Vuforia::ObjectTracker::getClassType()));
    if (objectTracker == 0) {
        NSLog(@"Error finding object tracker to unload data");
        return NO;
    }

    int numObjectTargets = objectTracker->getActiveDataSets().size();
    for (int i = 0; i < numObjectTargets; i++) {
        Vuforia::DataSet* thisDataSet = objectTracker->getActiveDataSets().at(i);
        
        if (!objectTracker->deactivateDataSet(thisDataSet)) {
            NSLog(@"Failed to deactivate data set");
        }
        
        if (!objectTracker->destroyDataSet(thisDataSet)) {
            NSLog(@"Failed to destroy data set");
        }
    }
    
    // Note: don't need to unload device tracker anchors.
    // On tracker stop, the anchors will be destroyed.
    
    NSLog(@"doUnloadTrackersData");
    return YES;
}

- (bool) doDeinitTrackers
{
    Vuforia::TrackerManager& trackerManager = Vuforia::TrackerManager::getInstance();
    trackerManager.deinitTracker(Vuforia::ObjectTracker::getClassType());
    if (!disablePositionalDeviceTracker) {
        trackerManager.deinitTracker(Vuforia::PositionalDeviceTracker::getClassType());
    }
    
    NSLog(@"doDeinitTrackers");
    return true;
}

- (void) configureVideoBackgroundWithViewWidth:(float)viewWidth andHeight:(float)viewHeight
{
    [self.eaglView configureVideoBackgroundWithCameraMode:[self.vapp getCameraMode] viewWidth:viewWidth viewHeight:viewHeight];
    NSLog(@"configureVideoBackgroundWithViewWidth:andHeight");
}

- (void)configureVideoBackgroundWithCameraMode:(Vuforia::CameraDevice::MODE)cameraMode viewWidth:(float)viewWidth andHeight:(float)viewHeight
{
    [self.eaglView configureVideoBackgroundWithCameraMode:cameraMode viewWidth:viewWidth viewHeight:viewHeight];
    NSLog(@"configureVideoBackgroundWithCameraMode:viewWidth:andHeight");
}

// optional protocol implementation
- (void) onVuforiaUpdate:(Vuforia::State *)state
{
    if (projectionMatrixCompletionHandler) {
        // try getting the projection matrix this frame...

        if ([self.eaglView isProjectionMatrixReady]) {
            Vuforia::Matrix44F projectionMatrix = [self.eaglView getProjectionMatrix];
            NSString* projectionMatrixString = [self stringFromMatrix44F:projectionMatrix];
            projectionMatrixCompletionHandler(projectionMatrixString);
            projectionMatrixCompletionHandler = nil;
        } else {
            NSLog(@"projection matrix is not ready at this state");
        }
    }

    if (!isCameraPaused) { // if frozen, keep sending old markers into javascript app

        [self.markersFound removeAllObjects]; // only reset detected markers if unfrozen
        
        int numOfTrackables = state->getTrackableResults().size();;
        for (int i = 0; i < numOfTrackables; i++) {
            const Vuforia::TrackableResult* result = state->getTrackableResults().at(i);

            if(result->getStatus() != Vuforia::TrackableResult::DETECTED &&
               result->getStatus() != Vuforia::TrackableResult::TRACKED &&
//               result->getStatus() != Vuforia::TrackableResult::LIMITED &&
               result->getStatus() != Vuforia::TrackableResult::EXTENDED_TRACKED) {
                continue;
            }
            
            const Vuforia::Trackable & trackable = result->getTrackable();

            NSString* trackingStatus;

            if (result->getStatus() == Vuforia::TrackableResult::EXTENDED_TRACKED) {
                trackingStatus = @"EXTENDED_TRACKED";
            } else { // TODO: check if we need to handle (status == TrackableResult::DETECTED or LIMITED or NO_POSE)
                trackingStatus = @"TRACKED";
            };
            
            if (trackable.isOfType(Vuforia::AreaTarget::getClassType())) {
                Vuforia::AreaTarget* areaTarget = (Vuforia::AreaTarget *)(&trackable);
                NSString* targetId = [NSString stringWithUTF8String:areaTarget->getUniqueTargetId()];
                if ([trackingStatus isEqualToString:@"EXTENDED_TRACKED"]) {
                    trackingStatus = @"TRACKED";
                }
            }

            Vuforia::Matrix44F modelViewMatrixCorrected = Vuforia::Tool::convert2GLMatrix(result->getPose());
            // scale from meter to mm scale, so the UI can be backwards compatible with older Vuforia versions that used mm
            modelViewMatrixCorrected.data[12] *= 1000;
            modelViewMatrixCorrected.data[13] *= 1000;
            modelViewMatrixCorrected.data[14] *= 1000;
            
            Vuforia::Vec3F markerSize;
            if(trackable.isOfType(Vuforia::ImageTarget::getClassType())){
                Vuforia::ImageTarget* imageTarget = (Vuforia::ImageTarget *)(&trackable);
                markerSize = imageTarget->getSize();
            }

            NSDictionary* marker = @{@"name": [NSString stringWithUTF8String:trackable.getName()],
                                     @"modelViewMatrix": [self stringFromMatrix44F:modelViewMatrixCorrected],
                                     @"trackingStatus": trackingStatus};

            // send in Positional Device Trackers' information in a different way, via the camera matrix
            if (!disablePositionalDeviceTracker) {
                if (trackable.isOfType(Vuforia::DeviceTrackable::getClassType())) {
                    deviceTrackableResult = result;
                    if (cameraMatrixCompletionHandler) {
                        cameraMatrixCompletionHandler(marker);
                    }
                    continue;
                }
            }

            // filter out extended-tracked objects because we rely on visibility of objects to decide whether to render or not
            if (![trackingStatus isEqualToString:@"EXTENDED_TRACKED"]) {
                [self.markersFound addObject:marker];
            }
        }
        
    }
    
    // regardless of whether it's frozen or not, trigger the javascript callback every frame with the set of detected objects
    if (visibleMarkersCompletionHandler) {
        visibleMarkersCompletionHandler(self.markersFound);
    }
}

@end
