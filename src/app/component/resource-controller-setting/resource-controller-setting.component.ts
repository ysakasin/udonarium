import * as Beautify from 'vkbeautify';

import { Component, OnInit } from '@angular/core';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { ObjectSerializer } from '../../class/core/synchronize-object/object-serializer';
import { FileArchiver } from '../../class/core/file-storage/file-archiver';
import { ResourceController, Handler } from '../../class/resource-controller';
import { ModalService } from '../../service/modal.service';
import { PanelService } from '../../service/panel.service';
import { ChatMessageService } from '../../service/chat-message.service';
import { GameCharacter } from '../../class/game-character';

@Component({
  selector: 'app-resource-controller-setting',
  templateUrl: './resource-controller-setting.component.html',
  styleUrls: ['./resource-controller-setting.component.css']
})
export class ResourceControllerSettingComponent implements OnInit {
  private readonly handleType = Handler;
  private selectedController: ResourceController = null;
  private selectedControllerXml = '';

  private selectedCharacter: GameCharacter = null;

  get resourceControllers(): ResourceController[] { return ObjectStore.instance.getObjects(ResourceController); }
  get gameCharacters(): GameCharacter[] { return ObjectStore.instance.getObjects(GameCharacter); }

  get titleName(): string { return this.selectedController.title; }
  set titleName(titleName: string) { if (this.isEditable) { this.selectedController.title = titleName; } }

  get dataName(): string { return this.selectedController.dataName; }
  set dataName(dataName: string) { if (this.isEditable) { this.selectedController.dataName = dataName; } }

  get handler(): Handler { return this.selectedController.handler; }
  set handler(handler: Handler) { if (this.isEditable) { this.selectedController.handler = handler; } }

  get valueDiff(): number { return this.selectedController.valueDiff; }
  set valueDiff(valueDiff: number) { if (this.isEditable) { this.selectedController.valueDiff = valueDiff; } }

  get chatTabidentifier(): string { return this.selectedController.chatTabidentifier; }
  set chatTabidentifier(chatTabidentifier: string) { if (this.isEditable) { this.selectedController.chatTabidentifier = chatTabidentifier; } }

  get messageTemplate(): string { return this.selectedController.messageTemplate; }
  set messageTemplate(messageTemplate: string) { if (this.isEditable) { this.selectedController.messageTemplate = messageTemplate; } }

  get isEmpty(): boolean { return this.resourceControllers.length < 1; }
  get isDeleted(): boolean { return this.selectedController ? ObjectStore.instance.get(this.selectedController.identifier) == null : false; }
  get isEditable(): boolean { return !this.isEmpty && !this.isDeleted; }

  constructor(
    private modalService: ModalService,
    private panelService: PanelService,
    public chatMessageService: ChatMessageService,
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
    resourceController.chatTabidentifier = this.chatMessageService.chatTabs ? this.chatMessageService.chatTabs[0].identifier : '';
    resourceController.title = 'HP回復';
    resourceController.dataName = 'HP';
    resourceController.handler = Handler.PLUS;
    resourceController.valueDiff = 1;
    resourceController.messageTemplate = '{0}の{1}を{3}回復{4}';
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

  selectGameCharacter(identifier: string) {
    this.selectedCharacter = ObjectStore.instance.get<GameCharacter>(identifier);
  }

  send() {
    console.log('TODO:リソースカウンターの適用処理');
  }
}
