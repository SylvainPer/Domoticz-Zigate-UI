import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { NotifyService } from '@app/services/notify.service';
import { TranslateService } from '@ngx-translate/core';

const log = new Logger('ReloadPluginComponent');

@Component({
  selector: 'app-rescan-group',
  templateUrl: './rescan-group.component.html',
  styleUrls: ['./rescan-group.component.scss']
})
export class RescanGroupComponent implements OnInit {
  constructor(
    private notifyService: NotifyService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  rescanGroup() {
    this.apiService.getRescanGroup().subscribe((result: any) => {
      this.notifyService.notify(this.translate.instant('admin.rescan.group.notify'));
    });
  }
}