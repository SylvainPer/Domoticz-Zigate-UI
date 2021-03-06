import { Component, OnDestroy, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { VersionService } from '@app/services/version-service';
import { TranslateService } from '@ngx-translate/core';
import { Chart } from 'angular-highcharts';
import { forkJoin } from 'rxjs';
import { GlobalPosition, InsidePlacement, Toppy, ToppyControl } from 'toppy';
import { PluginStats } from '../shared/models/plugin-stats';
import { DeviceByNameComponent } from './device-by-name/device-by-name.component';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { HeaderService } from '@app/services/header-service';

const log = new Logger('DashboardComponent');

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends UnsubscribeOnDestroyAdapter implements OnInit, OnDestroy {
  chart: Chart;
  devices: any;
  routers: any;
  inDbs: any;
  healthsLive: any;
  healthsNotSeen: any;
  healthsNotReachable: any;
  healthsOthers: any = {};
  pluginStats: PluginStats;
  totalTraficSent: any = {};
  totalTraficRetx: any = {};
  totalTraficReceived: any = {};
  totalTraficCluster: any = {};
  totalTraficCrc: any = {};
  maxLoad: any = {};
  currentLoad: any = {};
  devicesOnBattery: any;
  batterySup50: any;
  batterySup30: any;
  batteryInf30: any;

  advancedPieLoad: any;
  advancedPieSent: any;
  advancedPieReceived: any;
  advancedPieDevice: any;
  advancedPieState: any;
  advancedPieBattery: any;
  advancedPieLoadLabel: string;
  advancedPieSentLabel: string;
  advancedPieReceivedLabel: string;
  advancedPieDeviceLabel: string;
  advancedPieStateLabel: string;
  advancedPieBatteryLabel: string;

  gaugeType = 'full';
  gaugeAppendText = '';

  thick = 15;
  toppyControl: ToppyControl;

  animations = true;
  gradient = false;
  tooltipDisabled = false;
  colorSchemeROG = {
    domain: ['red', 'orange', 'green']
  };
  colorSchemeGROG = {
    domain: ['green', 'red', 'orange', 'gray']
  };
  colorSchemeGOR = {
    domain: ['green', 'blue', 'red']
  };
  colorSchemeGO = {
    domain: ['green', 'cyan']
  };
  colorSchemeGR = {
    domain: ['green', 'red']
  };

  date: Date;

  constructor(
    private apiService: ApiService,
    private toppy: Toppy,
    private versionService: VersionService,
    private headerService: HeaderService,
    private translateService: TranslateService
  ) {
    super();
  }

  ngOnInit() {
    this.getInfos();
  }

  getInfos() {
    this.date = new Date();
    this.advancedPieLoadLabel = this.translateService.instant('dashboard.trafic.maxload.label');
    this.advancedPieSentLabel = this.translateService.instant('dashboard.trafic.total.trafic.sent.label');
    this.advancedPieReceivedLabel = this.translateService.instant('dashboard.trafic.total.trafic.received.label');
    this.advancedPieDeviceLabel = this.translateService.instant('dashboard.devices.label');
    this.advancedPieStateLabel = this.translateService.instant('dashboard.devices.state.label');
    this.advancedPieBatteryLabel = this.translateService.instant('dashboard.devices.battery.label');
    forkJoin([this.apiService.getPluginStats(), this.apiService.getZDevices()]).subscribe(([res, devices]) => {
      this.pluginStats = res;
      this.createChart();
      this.totalTraficSent.label = this.translateService.instant('dashboard.trafic.total.trafic.sent');
      this.totalTraficSent.total = res.Sent;
      this.totalTraficRetx.label = this.translateService.instant('dashboard.trafic.retx');
      this.totalTraficRetx.total = ((res.ReTx / res.Sent) * 100).toFixed(0);
      this.totalTraficRetx.append = '%';
      this.totalTraficReceived.label = this.translateService.instant('dashboard.trafic.total.trafic.received');
      this.totalTraficReceived.total = res.Received;
      this.totalTraficCluster.label = this.translateService.instant('dashboard.trafic.cluster');
      this.totalTraficCluster.total = ((res.Cluster / res.Received) * 100).toFixed(0);
      this.totalTraficCluster.append = '%';
      this.totalTraficCrc.label = this.translateService.instant('dashboard.trafic.crc');
      this.totalTraficCrc.total = ((res.CRC / res.Received) * 100).toFixed(0);
      this.totalTraficCrc.append = '%';
      this.maxLoad.label = this.translateService.instant('dashboard.trafic.maxload');
      this.maxLoad.total = res.MaxLoad;
      this.currentLoad.label = this.translateService.instant('dashboard.trafic.currentload');
      this.currentLoad.total = res.CurrentLoad;
      this.advancedPieLoad = [
        { name: this.translateService.instant('dashboard.trafic.maxload'), value: res.MaxLoad - res.CurrentLoad },
        { name: this.translateService.instant('dashboard.trafic.currentload'), value: res.CurrentLoad }
      ];
      this.advancedPieSent = [
        { name: this.translateService.instant('dashboard.trafic.total.trafic.sent'), value: res.Sent - res.ReTx },
        { name: this.translateService.instant('dashboard.trafic.retx'), value: res.ReTx }
      ];
      this.advancedPieReceived = [
        {
          name: this.translateService.instant('dashboard.trafic.total.trafic.received'),
          value: res.Received - res.Cluster - res.CRC
        },
        { name: this.translateService.instant('dashboard.trafic.cluster'), value: res.Cluster },
        { name: this.translateService.instant('dashboard.trafic.crc'), value: res.CRC }
      ];
      this.devices = devices;
      this.devices.total = this.devices.length;
      this.devices.label = this.translateService.instant('devices');
      this.routers = this.devices.filter((router: any) => router.LogicalType === 'Router');
      this.routers.label = this.translateService.instant('dashboard.devices.routers');
      this.routers.total = ((this.routers.length / this.devices.total) * 100).toFixed(0);
      this.routers.append = '%';
      this.inDbs = this.devices.filter((router: any) => router.Status === 'inDB');
      this.inDbs.label = this.translateService.instant('dashboard.devices.indb');
      this.inDbs.total = ((this.inDbs.length / this.devices.total) * 100).toFixed(0);
      this.inDbs.append = '%';
      this.healthsLive = this.devices.filter((device: any) => device.Health === 'Live' && device.Status !== 'notDB');
      this.healthsLive.label = this.translateService.instant('dashboard.devices.live');
      this.healthsLive.total = ((this.healthsLive.length / this.devices.total) * 100).toFixed(0);
      this.healthsLive.append = '%';
      this.healthsNotReachable = this.devices.filter((device: any) => {
        return device.Health === 'Not Reachable' && device.Status !== 'notDB';
      });
      this.healthsNotReachable.label = this.translateService.instant('dashboard.devices.notReachable');
      this.healthsNotReachable.total = ((this.healthsNotReachable.length / this.devices.total) * 100).toFixed(0);
      this.healthsNotReachable.append = '%';
      this.healthsNotSeen = this.devices.filter((device: any) => {
        return device.Health === 'Not seen last 24hours' && device.Status !== 'notDB';
      });
      this.healthsNotSeen.label = this.translateService.instant('dashboard.devices.notseen');
      this.healthsNotSeen.total = ((this.healthsNotSeen.length / this.devices.total) * 100).toFixed(0);
      this.healthsNotSeen.append = '%';
      this.healthsOthers = this.devices.filter((device: any) => {
        return (
          device.Health !== 'Not seen last 24hours' &&
          device.Health !== 'Not Reachable' &&
          device.Health !== 'Live' &&
          device.Status !== 'notDB'
        );
      });
      this.healthsOthers.label = this.translateService.instant('dashboard.devices.enddevice');
      this.healthsOthers.total = ((this.healthsOthers.length / this.devices.total) * 100).toFixed(0);
      this.healthsOthers.append = '%';
      this.advancedPieDevice = [
        {
          name: this.translateService.instant('dashboard.devices.routers'),
          value: this.routers.length
        },
        {
          name: this.translateService.instant('dashboard.devices.enddevice'),
          value: this.devices.length - this.routers.length
        }
      ];
      this.advancedPieState = [
        {
          name: this.translateService.instant('dashboard.devices.live'),
          value: this.healthsLive.length
        },
        {
          name: this.translateService.instant('dashboard.devices.notReachable'),
          value: this.healthsNotReachable.length
        },
        {
          name: this.translateService.instant('dashboard.devices.notseen'),
          value: this.healthsNotSeen.length
        },
        { name: this.translateService.instant('dashboard.devices.others'), value: this.healthsOthers.length }
      ];
      this.devicesOnBattery = devices.filter(
        (device: any) => device.LogicalType !== 'Router' && device.Status !== 'notDB'
      );
      const _batteryInf30 = this.devicesOnBattery.filter((device: any) => device.Battery < 30);
      const _batterySup30 = this.devicesOnBattery.filter((device: any) => device.Battery > 30 && device.Battery < 50);
      const _batterySup50 = this.devicesOnBattery.filter((device: any) => device.Battery > 50);
      this.batteryInf30 = this.devices.filter((it: any) => _batteryInf30.find((iter: any) => iter.IEEE === it.IEEE));
      this.batterySup50 = this.devices.filter((it: any) => _batterySup50.find((iter: any) => iter.IEEE === it.IEEE));
      this.batterySup30 = this.devices.filter((it: any) => _batterySup30.find((iter: any) => iter.IEEE === it.IEEE));
      this.batteryInf30.totalDevices = this.devicesOnBattery.length;
      this.batteryInf30.label = this.translateService.instant('dashboard.devices.battery.inf.30');
      this.batteryInf30.total = this.batteryInf30.length;
      this.batteryInf30.append = this.translateService.instant('devices');
      this.batterySup30.label = this.translateService.instant('dashboard.devices.battery.sup.30');
      this.batterySup30.total = this.batterySup30.length;
      this.batterySup30.append = this.translateService.instant('devices');
      this.batterySup50.label = this.translateService.instant('dashboard.devices.battery.sup.50');
      this.batterySup50.total = this.batterySup50.length;
      this.batterySup50.append = this.translateService.instant('devices');
      this.advancedPieBattery = [
        {
          name: this.translateService.instant('dashboard.devices.battery.inf.30'),
          value: this.batteryInf30.length
        },
        {
          name: this.translateService.instant('dashboard.devices.battery.sup.30'),
          value: this.batterySup30.length
        },
        { name: this.translateService.instant('dashboard.devices.battery.sup.50'), value: this.batterySup50.length }
      ];
      this.headerService.setError(res.Error);
    });
  }

  percentageFormatting(value: any) {
    return Math.round(value);
  }

  createChart() {
    const tx: any[] = [];
    const rx: any[] = [];
    const load: any[] = [];

    const sorted = this.pluginStats.Trend.sort((t1, t2) => {
      const ts1 = t1._TS;
      const ts2 = t2._TS;
      if (ts1 > ts2) {
        return 1;
      }
      if (ts1 < ts2) {
        return -1;
      }
      return 0;
    });

    let secondsToSubstract = sorted.length * 5;
    sorted.forEach(trend => {
      const dateFin = new Date(this.date);
      const datePlot = new Date(dateFin.setSeconds(dateFin.getSeconds() - secondsToSubstract));
      secondsToSubstract = secondsToSubstract - 5;
      tx.push({ x: datePlot, y: trend.Txps });
      rx.push({ x: datePlot, y: trend.Rxps });
      load.push({ x: datePlot, y: trend.Load });
    });

    const chart = new Chart({
      chart: {
        type: 'area',
        height: '150'
      },
      title: {
        text: ''
      },
      legend: {
        align: 'center',
        verticalAlign: 'top',
        floating: true
      },
      xAxis: {
        allowDecimals: false,
        labels: {
          formatter: function() {
            const date = new Date(this.value);
            return (
              date.getHours() +
              (date.getMinutes() > 9 ? ':' + date.getMinutes() : ':0' + date.getMinutes()) +
              (date.getSeconds() > 9 ? ':' + date.getSeconds() : ':0' + date.getSeconds())
            );
          }
        },
        type: 'datetime'
      },
      yAxis: {
        title: {
          text: ''
        },
        labels: {
          formatter: function() {
            return this.value + '';
          }
        }
      },
      tooltip: {
        pointFormat: '{series.name} <b>{point.y}</b>'
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        area: {
          marker: {
            enabled: false,
            symbol: 'circle',
            radius: 2,
            states: {
              hover: {
                enabled: true
              }
            }
          }
        }
      },
      series: [
        {
          name: this.translateService.instant('dashboard.txps'),
          data: tx,
          type: 'area',
          color: 'blue'
        },
        {
          name: this.translateService.instant('dashboard.rxps'),
          data: rx,
          type: 'area',
          color: 'green'
        },
        {
          name: this.translateService.instant('dashboard.load'),
          data: load,
          type: 'area',
          color: 'orange'
        }
      ]
    });
    this.chart = chart;

    this.subs.add(chart.ref$.subscribe());
  }

  open(name: string, event: any) {
    let devices;
    if (name === 'device') {
      if (event.name === this.translateService.instant('dashboard.devices.routers')) {
        devices = this.routers;
      } else {
        devices = this.devicesOnBattery;
      }
    } else if (name === 'state') {
      if (event.name === this.translateService.instant('dashboard.devices.live')) {
        devices = this.healthsLive;
      } else if (event.name === this.translateService.instant('dashboard.devices.others')) {
        devices = this.healthsOthers;
      } else if (event.name === this.translateService.instant('dashboard.devices.notReachable')) {
        devices = this.healthsNotReachable;
      } else {
        devices = this.healthsNotSeen;
      }
    } else if (name === 'battery') {
      if (event.name === this.translateService.instant('dashboard.devices.battery.inf.30')) {
        devices = this.batteryInf30;
      } else if (event.name === this.translateService.instant('dashboard.devices.battery.sup.30')) {
        devices = this.batterySup30;
      } else {
        devices = this.batterySup50;
      }
    }

    this.toppyControl = this.toppy
      .position(
        new GlobalPosition({
          placement: InsidePlacement.BOTTOM,
          width: '80%',
          height: 'auto'
        })
      )
      .config({
        closeOnDocClick: false,
        closeOnEsc: true
      })
      .content(DeviceByNameComponent, { devices: devices })
      .create();

    this.subs.add(this.toppyControl.listen('t_compins').subscribe(comp => {}));

    this.toppyControl.open();
  }

  close() {
    if (this.toppyControl) {
      this.toppyControl.close();
    }
  }

  refresh() {
    this.getInfos();
    this.versionService.setReload(true);
  }

  ngOnDestroy(): void {
    this.close();
  }
}
