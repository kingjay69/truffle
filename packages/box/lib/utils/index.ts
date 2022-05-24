import unbox from "./unbox";
import recipe from "./recipe";
import fs from "fs";
import config from "../config";
import tmp from "tmp";
import path from "path";
import type { boxConfig, unboxOptions, setUpBoxOptions } from "typings";

export = {
  downloadBox: async (source: string, destination: string, events: any) => {
    events.emit("unbox:downloadingBox:start");

    await unbox.verifySourcePath(source);
    await unbox.fetchRepository(source, destination);
    events.emit("unbox:downloadingBox:succeed");
  },

  readBoxConfig: async (destination: string) => {
    const possibleConfigs = [
      path.join(destination, "truffle-box.json"),
      path.join(destination, "truffle-init.json")
    ];

    const configPath = possibleConfigs.reduce(
      (path, alt) => path || (fs.existsSync(alt) && alt),
      undefined
    );

    return await config.read(configPath);
  },

  setUpTempDirectory: (events: any) => {
    events.emit("unbox:preparingToDownload:start");
    const options = {
      unsafeCleanup: true
    };
    const tmpDir = tmp.dirSync(options);
    events.emit("unbox:preparingToDownload:succeed");
    return {
      path: path.join(tmpDir.name, "box"),
      cleanupCallback: tmpDir.removeCallback
    };
  },

  unpackBox: async (
    tempDir: string,
    destination: string,
    boxConfig: boxConfig,
    unpackBoxOptions: unboxOptions
  ) => {
    unbox.prepareToCopyFiles(tempDir, boxConfig);
    await unbox.copyTempIntoDestination(tempDir, destination, unpackBoxOptions);
  },

  setUpBox: async (
    boxConfig: boxConfig,
    destination: string,
    events: any,
    setUpBoxOptions: setUpBoxOptions
  ) => {
    events.emit("unbox:settingUpBox:start");
    unbox.installBoxDependencies(boxConfig, destination);
    await events.emit("unbox:settingUpBox:succeed");
    await recipe.followBoxRecipe(
      boxConfig,
      destination,
      setUpBoxOptions.recipe
    );
  }
};
