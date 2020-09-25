# Vuforia WebXR Template

## Read First

This project was forked from the source code of the Vuforia Spatial Toolbox. Please read the [MPL 2.0 license](LICENSE) before use.

## Installation
How to build and run the iOS App from your Mac OS Computer.

(Note: these instructions use SSH to clone from Git, but it can also be done with HTTPS)


### Step-by-step Instructions

1. Clone the vuforia-webXR-template-ios repo from GitHub. The master branches of all
   repositories should be stable.

```
git clone git@github.com:ptcrealitylab/vuforia-webXR-template-ios.git
cd vuforia-webXR-template-ios
```

2. Clone the vuforia-webXR-template-userinterface into the bin/data directory of the app, and
   rename the directory to "userinterface".

```
cd bin/data
git clone git@github.com:ptcrealitylab/vuforia-webXR-template-userinterface.git
mv vuforia-webXR-template-userinterface userinterface
```

7. Download Vuforia SDK version 9.x.x for iOS from https://developer.vuforia.com/downloads/sdk
   (Click the "Download for iOS" link for *vuforia-sdk-ios-9-x-x.zip*).

- Paste the Vuforia.framework file from the `build` directory of the download into the top level
  of the `vuforia-webXR-template-ios` directory.
- If the latest Vuforia SDK version has been updated beyond this documentation, please consult the
  [forum](https://forum.spatialtoolbox.vuforia.com) for how to proceed.

8. Get a Vuforia Engine license key from http://developer.vuforia.com.

Create a vuforiaKey.h file in the `vuforia-webXR-template-ios/VuforiaWebXR` directory,
and paste your key into the `vuforiaKey` const. It should look like:

```
//  vuforiaKey.h
//  Licensed from http://developer.vuforia.com

#ifndef vuforiaKey_h
#define vuforiaKey_h

const char* vuforiaKey = "Replace this string with your license key";

#endif /* vuforiaKey_h */
```

9. When these files are in place, open VuforiaWebXR.xcodeproj. Make sure
   Xcode is set up with your Apple developer profile for code signing. You should be able to
   compile and run the project (it won't run on the simulator; you need to have an iOS device
   connected).

### Device Compatibility

The device compatibility should mirror the Vuforia Spatial Toolbox. This has been developed
primarily with iOS 11–14 and with device models iPhone 6S through 11 Pro.

For more information, consult the [device compatibility matrix](https://spatialtoolbox.vuforia.com/docs/download).

### Notes

If your log window is being spammed with `[Process] kill() returned unexpected
error 1` check out [this StackOverflow answer](https://stackoverflow.com/a/58774271).
