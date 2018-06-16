import { Component, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
//import { NgForm } from '@angular/forms';

import { GameCharacterSheetComponent } from '../game-character-sheet/game-character-sheet.component';
import { ModalService } from '../../service/modal.service';
import { PanelService, PanelOption } from '../../service/panel.service';

import { Card } from '../../class/card';
import { CardStack } from '../../class/card-stack';
import { TabletopObject } from '../../class/tabletop-object';
import { GameCharacter } from '../../class/game-character';
import { GameTableMask } from '../../class/game-table-mask';
import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { GameObject } from '../../class/core/synchronize-object/game-object';
import { DataElement } from '../../class/data-element';
import { ContextMenuService } from '../../service/context-menu.service';
import { PointerDeviceService } from '../../service/pointer-device.service';
import { ChatMessageContext } from '../../class/chat-message';
import { ChatMessageService } from '../../service/chat-message.service';
import { ChatTab } from '../../class/chat-tab';
import { PeerCursor } from '../../class/peer-cursor';
import { ResourceControllerSettingComponent } from '../resource-controller-setting/resource-controller-setting.component';

@Component({
  selector: 'game-object-inventory',
  templateUrl: './game-object-inventory.component.html',
  styleUrls: ['./game-object-inventory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameObjectInventoryComponent {
  //private inventoryType: string = 'table';
  inventoryTypes: string[] = ['table', 'common', 'graveyard'];
  private gameObjectsChach: { [inventoryType: string]: GameObject[] } = { 'table': [], 'common': [], 'graveyard': [] };

  private selectedIdentifier: string = '';
  private networkService = Network;

  get myPeer(): PeerCursor { return PeerCursor.myCursor; }

  constructor(
    private changeDetector: ChangeDetectorRef,
    //private gameRoomService: GameRoomService,
    //private networkService: NetworkService,
    private viewContainerRef: ViewContainerRef,
    private modalService: ModalService,
    private panelService: PanelService,
    private contextMenuService: ContextMenuService,
    private pointerDeviceService: PointerDeviceService,
    private chatMessageService: ChatMessageService
  ) { }

  ngOnInit() {
    this.panelService.title = 'インベントリ';
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        let object = ObjectStore.instance.get(event.data.identifier);
        if (object instanceof TabletopObject || object instanceof DataElement) this.changeDetector.markForCheck();
      })
      .on('SELECT_TABLETOP_OBJECT', -1000, event => {
        if (ObjectStore.instance.get(event.data.identifier) instanceof TabletopObject) {
          this.selectedIdentifier = event.data.identifier;
          this.changeDetector.markForCheck();
        }
      });
    this.inventoryTypes = ['table', 'common', Network.peerId, 'graveyard'];
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  getGameObjects(inventoryType: string) {
    let identifiersArray: TabletopObject[][] = [];
    identifiersArray[0] = ObjectStore.instance.getObjects(GameCharacter);
    //identifiersArray[1] = ObjectStore.instance.getObjects(Card);
    //identifiersArray[2] = ObjectStore.instance.getObjects(CardStack);
    //identifiersArray[1] = ObjectStore.instance.getObjects(GameTableMask);
    let gameObjects: GameObject[] = [];

    for (let identifiers of identifiersArray) {
      for (let identifier of identifiers) {
        switch (identifier.location.name) {
          case 'table':
            if (inventoryType === 'table') {
              gameObjects.push(identifier);
            }
            break;
          case Network.peerId:
            if (inventoryType === Network.peerId) {
              gameObjects.push(identifier);
            }
            break;
          case 'graveyard':
            if (inventoryType === 'graveyard') {
              gameObjects.push(identifier);
            }
            break;
          default:
            if (inventoryType === 'common' && !this.isPrivateLocation(identifier.location.name)) {
              gameObjects.push(identifier);
            }
            break;
        }
      }
    }
    return gameObjects;
  }

  private onContextMenu(e: Event, gameObject: TabletopObject) {
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();

    this.selectGameObject(gameObject);

    if (!this.pointerDeviceService.isAllowedToOpenContextMenu) { return; }
    if (!(gameObject instanceof GameCharacter)) { return; }

    const potison = this.pointerDeviceService.pointers[0];
    console.log('mouseCursor', potison);
    this.contextMenuService.open(potison, [
      { name: 'HP+10', action: () => { this.changeNumberResource(gameObject, 'HP', 10, ''); } },
      { name: 'HP-10', action: () => { this.changeNumberResource(gameObject, 'HP', -10, ''); } },
      { name: 'MP+10', action: () => { this.changeNumberResource(gameObject, 'MP', 10, ''); } },
      { name: 'MP-10', action: () => { this.changeNumberResource(gameObject, 'MP', -10, ''); } },
      { name: '夢を渡す', action: () => { this.changeNumberResource(gameObject, '夢', 1, ''); } },
      { name: '器用度+1', action: () => { this.changeNumberResource(gameObject, '器用度', 1, ''); } },
      { name: '設定を表示', action: () => { this.showResourceController(); } },
    ], gameObject.name);
  }

  private changeNumberResource(gameCharacter: GameCharacter, dataName: string, valueDiff: number, chatTabidentifier: string): void {
    console.log('changeNumberResource');
    const dataElements: DataElement[] = gameCharacter.detailDataElement.getElementsByName(dataName);
    let messageText = '';
    if (dataElements.length === 0) {
      messageText = `${gameCharacter.name}に「${dataName}」が存在しません`;
    } else {
      const dataElm = dataElements[0];
      if (!dataElm.isNumberResource) {
        messageText = `${gameCharacter.name}の「${dataName}」はリソースではありません`;
      } else {
        const beforeValue = dataElm.currentValue;
        const beforeValueInt: number = (typeof beforeValue === 'string') ? Number.parseInt(beforeValue) : beforeValue;
        dataElm.currentValue = beforeValueInt + valueDiff;
        messageText = `${gameCharacter.name}の${dataName}を${valueDiff}しました (${dataName}: ${beforeValue} -> ${dataElm.currentValue})`;
      }
    }

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

    let chatTab: ChatTab = ObjectStore.instance.get<ChatTab>(chatTabidentifier);
    if (!chatTabidentifier) {
      const chatTabs: ChatTab[] = this.chatMessageService.chatTabs;
      if (chatTabs.length === 0) { return; }
      chatTab = chatTabs[0];
    }

    if (chatTab) { chatTab.addMessage(chatMessage); }
  }

  private cloneGameObject(gameObject: TabletopObject) {
    gameObject.clone();
  }

  private showDetail(gameObject: TabletopObject) {
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
    //this.modalService.open(GameCharacterSheetComponent);
    let option: PanelOption = { left: 0, top: 0, width: 800, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  private selectGameObject(gameObject: GameObject) {
    let aliasName: string = gameObject.aliasName;
    console.log('onSelectedGameObject <' + aliasName + '>', gameObject.identifier);
    EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: gameObject.identifier, className: gameObject.aliasName });
  }

  private deleteGameObject(gameObject: GameObject) {
    gameObject.destroy();
  }

  private isPrivateLocation(location: string): boolean {
    for (let conn of Network.peerContexts) {
      if (conn.isOpen && location === conn.fullstring) {
        return true;
      }
    }
    return false;
  }

  private showResourceController() {
    const option: PanelOption = { left: 0, top: 0, width: 800, height: 600 };
    const component = this.panelService.open<ResourceControllerSettingComponent>(ResourceControllerSettingComponent, option);
  }
}
