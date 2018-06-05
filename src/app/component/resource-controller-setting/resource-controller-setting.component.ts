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
import { ChatTab } from '../../class/chat-tab';
import { Network } from '../../class/core/system/system';
import { ChatMessageContext } from '../../class/chat-message';
import { PeerCursor } from '../../class/peer-cursor';

@Component({
  selector: 'app-resource-controller-setting',
  templateUrl: './resource-controller-setting.component.html',
  styleUrls: ['./resource-controller-setting.component.css']
})
export class ResourceControllerSettingComponent implements OnInit {
  readonly handleType = Handler;
  selectedController: ResourceController = null;
  private selectedControllerXml = '';

  chatTabidentifier = '';
  private selectedCharacter: GameCharacter = null;

  get myPeer(): PeerCursor { return PeerCursor.myCursor; }

  get resourceControllers(): ResourceController[] { return ObjectStore.instance.getObjects(ResourceController); }
  get gameCharacters(): GameCharacter[] { return ObjectStore.instance.getObjects(GameCharacter); }

  get titleName(): string { return this.selectedController.titleName; }
  set titleName(titleName: string) { if (this.isEditable) { this.selectedController.titleName = titleName; } }

  get dataName(): string { return this.selectedController.dataName; }
  set dataName(dataName: string) { if (this.isEditable) { this.selectedController.dataName = dataName; } }

  get handler(): Handler { return this.selectedController.handler; }
  set handler(handler: Handler) { if (this.isEditable) { this.selectedController.handler = handler; } }

  get valueDiff(): number { return this.selectedController.valueDiff; }
  set valueDiff(valueDiff: number) { if (this.isEditable) { this.selectedController.valueDiff = valueDiff; } }

  // get chatTabidentifier(): string { return this.chatTabidentifier; }
  // set chatTabidentifier(chatTabidentifier: string) { if (this.isEditable) { this.chatTabidentifier = chatTabidentifier; } }

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
    this.chatTabidentifier = this.chatMessageService.chatTabs ? this.chatMessageService.chatTabs[0].identifier : '';
  }

  onChangeSelectController(identifier: string) {
    this.selectedController = ObjectStore.instance.get<ResourceController>(identifier);
    this.selectedControllerXml = '';
  }

  create() {
    console.log('resourceController create');
    const resourceController = new ResourceController();
    // resourceController.chatTabidentifier = this.chatMessageService.chatTabs ? this.chatMessageService.chatTabs[0].identifier : '';
    resourceController.titleName = 'HP回復';
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
    FileArchiver.instance.save(files, 'resourceController_' + this.selectedController.titleName);
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
    console.log('changeNumberResource');
    const messageText = this.selectedController.getMessage(this.selectedCharacter);

    const time = this.chatMessageService.getTime();
    console.log('time:' + time);
    const chatMessage: ChatMessageContext = {
      from: Network.peerContext.id,
      name: this.myPeer.name,
      text: messageText,
      timestamp: time,
      tag: 'system',
      imageIdentifier: this.myPeer.imageIdentifier,
      responseIdentifier: '',
    };

    let chatTab: ChatTab = ObjectStore.instance.get<ChatTab>(this.chatTabidentifier);
    if (!this.chatTabidentifier) {
      const chatTabs: ChatTab[] = this.chatMessageService.chatTabs;
      if (chatTabs.length === 0) { return; }
      chatTab = chatTabs[0];
    }

    if (chatTab) { chatTab.addMessage(chatMessage); }
  }
}
