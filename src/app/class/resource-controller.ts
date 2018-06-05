import { ObjectNode } from './core/synchronize-object/object-node';
import { SyncObject, SyncVar } from './core/synchronize-object/anotation';
import { GameCharacter } from './game-character';
import { DataElement } from './data-element';

@SyncObject('resource-controller')
export class ResourceController extends ObjectNode {
  @SyncVar() titleName: string;
  // @SyncVar() gameCharacter: GameCharacter;
  @SyncVar() dataName: string;
  @SyncVar() handler: Handler;
  @SyncVar() valueDiff: number;
  // @SyncVar() chatTabidentifier: string;
  @SyncVar() messageTemplate: string;

  getMessage(gameCharacter: GameCharacter): string {
    const dataElm = this.getDataElementByName(gameCharacter);
    if (dataElm === null) {
      return `${gameCharacter.name}に「${this.dataName}」が存在しません`;
    }
    if (!dataElm.isNumberResource) {
      return `${gameCharacter.name}の「${this.dataName}」はリソースではありません`;
    }
    const beforeValue = dataElm.currentValue;
    switch (this.handler) {
      case Handler.PLUS:
        dataElm.currentValue = this.addAsNumber(beforeValue, this.valueDiff);
        break;
      case Handler.MINUS:
        dataElm.currentValue = this.addAsNumber(beforeValue, -1 * this.valueDiff);
        break;
      default:
        dataElm.currentValue = this.valueDiff;
        break;
    }
    return this.formatMessageTemplate(gameCharacter, beforeValue, dataElm.currentValue);
  }

  private getDataElementByName(gameCharacter: GameCharacter): DataElement {
    const dataElements: DataElement[] = gameCharacter.detailDataElement.getElementsByName(this.dataName);
    if (dataElements.length === 0) {
      return null;
    }
    return dataElements[0];
  }

  private addAsNumber(lValue: string | number, rValue: number): number {
    const lNumber: number =
      typeof lValue === 'string' ? Number(lValue) : lValue;
    return lNumber + rValue;
  }

  private formatMessageTemplate(gameCharacter: GameCharacter, beforeValue: string | number, afterValue: number): string {
    if (!this.messageTemplate) {
      return '';
    }
    return this.messageTemplate
      .replace('{0}', gameCharacter.name)
      .replace('{1}', this.dataName)
      .replace('{2}', this.handler + this.valueDiff.toString())
      .replace('{3}', Math.abs(this.valueDiff).toString())
      .replace('{4}', `(${this.dataName}: ${beforeValue} -> ${afterValue})`);
  }
}

export enum Handler {
  PLUS = '+',
  MINUS = '-',
  EQUAL = '='
}
