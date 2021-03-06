export interface Firmware {
  ApplicationBuild: string;
  ApplicationRelease: string;
  FileName: string;
  ImageType: string;
  ManufCode: string;
  StackBuild: string;
  StackRelease: string;
  Version: string;
  label: string;
}

export interface FirmwareManufacturer {
  [key: string]: Firmware[];
}

export interface DevicesByManufacturer {
  DeviceName: string;
  Ep: string;
  Nwkid: string;
  SWBUILD_1: string;
  SWBUILD_3: string;
  label: string;
  OTALastTime: string;
  OTAType: string;
  OTAVersion: string;
}

export class FirmwareUpdate {
  'NwkId': string;
  'Ep': string;
  'Brand': string;
  'FileName': string;
  'ForceUpdate': boolean;
}
