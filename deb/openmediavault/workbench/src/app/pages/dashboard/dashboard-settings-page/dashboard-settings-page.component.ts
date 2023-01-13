/**
 * This file is part of OpenMediaVault.
 *
 * @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author    Volker Theile <volker.theile@openmediavault.org>
 * @copyright Copyright (c) 2009-2023 Volker Theile
 *
 * OpenMediaVault is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * OpenMediaVault is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { marker as gettext } from '@ngneat/transloco-keys-manager/marker';
import { finalize, withLatestFrom } from 'rxjs/operators';
import { DashboardUserConfig } from '~/app/core/components/dashboard/models/dashboard-user-config.model';

import { DashboardWidgetConfig } from '~/app/core/components/dashboard/models/dashboard-widget-config.model';
import { SelectionListPageConfig } from '~/app/core/components/intuition/models/selection-list-page-config.type';
import { DashboardWidgetConfigService } from '~/app/core/services/dashboard-widget-config.service';
import { BaseSelectionListPageComponent } from '~/app/pages/base-page-component';

type SelectionListItem = Pick<DashboardWidgetConfig, 'id' | 'title' | 'description'> & {
  enabled: boolean;
};

@Component({
  template:
    '<omv-intuition-selection-list-page [config]="this.config"></omv-intuition-selection-list-page>'
})
export class DashboardSettingsPageComponent
  extends BaseSelectionListPageComponent
  implements OnInit
{
  public config: SelectionListPageConfig = {
    title: gettext('Enabled widgets'),
    hasSelectAllButton: true,
    multiple: true,
    textProp: 'title',
    valueProp: 'id',
    hintProp: 'description',
    selectedProp: 'enabled',
    updateStoreOnSelectionChange: true,
    store: {
      data: [],
      sorters: [
        {
          dir: 'asc',
          prop: 'title'
        }
      ]
    },
    buttons: [
      {
        template: 'submit',
        execute: {
          type: 'click',
          click: this.onSubmit.bind(this)
        }
      },
      {
        template: 'cancel',
        execute: {
          type: 'url',
          url: '/dashboard'
        }
      }
    ]
  };

  constructor(
    private dashboardWidgetConfigService: DashboardWidgetConfigService,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    this.setLoadData(() => {
      this.page.loading = true;
      this.dashboardWidgetConfigService
        .getEnabled()
        .pipe(
          withLatestFrom(this.dashboardWidgetConfigService.configs$),
          finalize(() => (this.page.loading = false))
        )
        .subscribe(
          ([enabledWidgets, widgets]: [DashboardUserConfig, Array<DashboardWidgetConfig>]) => {
            this.config.store.data = widgets.map((widget) => {
              return {
                id: widget.id,
                title: widget.title,
                description: widget.description,
                enabled: enabledWidgets.widgets.map((m) => m.id).includes(widget.id)
              };
            });
            this.config.value = this.config.store.data
              .filter((f: SelectionListItem) => f.enabled)
              .map((m: SelectionListItem) => m.id);
          }
        );
    });
  }

  onSubmit(buttonConfig, store, value: Array<string>) {
    this.markAsPristine();
    this.dashboardWidgetConfigService
      .setEnabled(value)
      .subscribe(() => this.router.navigate(['/dashboard']));
  }
}
