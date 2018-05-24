import { ObjectNode } from './core/synchronize-object/object-node';
import { SyncObject, SyncVar } from './core/synchronize-object/anotation';
import { GameCharacter } from './game-character';
import { DataElement } from './data-element';

@SyncObject('resource-controller')
export class ResourceController extends ObjectNode {
  @SyncVar() title: string;
  @SyncVar() gameCharacter: GameCharacter;
  @SyncVar() dataName: string;
  @SyncVar() valueDiff: number;
  @SyncVar() chatTabidentifier: string;
  @SyncVar() messageTemplate: string;

  getMessage(): string {
    const dataElm = this.getDataElementByName();
    if (dataElm === null) {
      return `${this.gameCharacter.name}に「${this.dataName}」が存在しません`;
    }
    if (!dataElm.isNumberResource) {
      return `${this.gameCharacter.name}の「${this.dataName}」はリソースではありません`;
    }
    const beforeValue = dataElm.currentValue;
    dataElm.currentValue = this.addAsNumber(beforeValue, this.valueDiff);
    return this.formatMessageTemplate(beforeValue, dataElm.currentValue);
  }

  private getDataElementByName(): DataElement {
    const dataElements: DataElement[] = this.gameCharacter.detailDataElement.getElementsByName(this.dataName);
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

  private formatMessageTemplate(beforeValue: string | number, afterValue: number): string {
    if (!this.messageTemplate) {
      return '';
    }
    return this.messageTemplate
      .replace('{0}', this.gameCharacter.name)
      .replace('{1}', this.dataName)
      .replace('{2}', this.valueDiff.toString())
      .replace('{3}', Math.abs(this.valueDiff).toString())
      .replace('{4}', `(${this.dataName}: ${beforeValue} -> ${afterValue})`);
  }
}
