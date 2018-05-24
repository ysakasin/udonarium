import * as Beautify from 'vkbeautify';

import { Component, OnInit } from '@angular/core';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { ObjectSerializer } from '../../class/core/synchronize-object/object-serializer';
import { FileArchiver } from '../../class/core/file-storage/file-archiver';
import { ResourceController } from '../../class/resource-controller';
import { ModalService } from '../../service/modal.service';
import { PanelService } from '../../service/panel.service';

@Component({
  selector: 'app-resource-controller-setting',
  templateUrl: './resource-controller-setting.component.html',
  styleUrls: ['./resource-controller-setting.component.css']
})
export class ResourceControllerSettingComponent implements OnInit {
  private selectedController: ResourceController = null;
  private selectedControllerXml = '';

  get resourceControllers(): ResourceController[] { return ObjectStore.instance.getObjects(ResourceController); }

  get titleName(): string { return this.selectedController.title; }
  set titleName(titleName: string) { if (this.isEditable) { this.selectedController.title = titleName; } }

  get isEmpty(): boolean { return this.resourceControllers.length < 1; }
  get isDeleted(): boolean { return this.selectedController ? ObjectStore.instance.get(this.selectedController.identifier) == null : false; }
  get isEditable(): boolean { return !this.isEmpty && !this.isDeleted; }

  constructor(
    private modalService: ModalService,
    private panelService: PanelService
  ) {}

  ngOnInit() {
    this.modalService.title = this.panelService.title = 'リソースコントローラー設定';
  }

  onChangeSelectController(identifier: string) {
    this.selectedController = ObjectStore.instance.get<ResourceController>(identifier);
    this.selectedControllerXml = '';
  }

  create() {
    console.log('resourceController create');
    const resourceController = new ResourceController();
    resourceController.title = 'コントローラー';
    resourceController.initialize();
    this.selectedController = resourceController;
  }

  save() {
    if (!this.selectedController) { return; }
    let xml = this.selectedController.toXml();

    xml = Beautify.xml(xml, 2);
    console.log(xml);

    const files: File[] = [new File([xml], 'data.xml', { type: 'text/plain' })];
    FileArchiver.instance.save(files, 'resourceController_' + this.selectedController.title);
  }

  delete() {
    if (!this.isEmpty && this.selectedController) {
      this.selectedControllerXml = this.selectedController.toXml();
      this.selectedController.destroy();
    }
  }

  restore() {
    if (this.selectedController && this.selectedControllerXml) {
      const restoreController = ObjectSerializer.instance.parseXml(this.selectedControllerXml);
      this.selectedControllerXml = '';
    }
  }
}
