import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  DialogData, NotationNode, TopConcept, VocabData, VocabNode
} from '../models/vocabulary.class';
import {MetadataService} from "./metadata.service";

@Injectable()
export class VocabNodeChangeService {
  dataChange = new BehaviorSubject<VocabNode[]>([]);
  private treeDepth: number = 1;

  get data(): VocabNode[] {
    return this.dataChange.value;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA)
    private dialogData: DialogData,
    private metadataService: MetadataService)
  {
    this.initialize();
  }

  private getTreeDepth(treeNodes?: TopConcept[]): number {
    if (!treeNodes || treeNodes.length === 0) {
      return 0;
    }

    return Math.max(
      ...treeNodes.map(node =>
        (node.narrower ? this.getTreeDepth(node.narrower) : 0) + 1
      )
    );
  }


  createTreeNodes(depth: number, notationNode: NotationNode, mapNarrowerDepth: number): VocabNode {
    const matchedNode = this.dialogData.value.find(v => v.id === notationNode.id);

    const createVocabNode = (id: string, label: string, notation: string[], description: string, children: VocabNode[]): VocabNode => {
      const node = new VocabNode();
      node.id = id;
      node.label = label;
      node.notation = notation;
      node.description = description;
      node.children = children;
      return node;
    };

    if (matchedNode) {
      return createVocabNode(
        matchedNode.id,
        matchedNode.name.substring(matchedNode.name.indexOf(' ') + 1) || '',
        matchedNode.notation || [],
        matchedNode.description || '',
        notationNode.narrower && notationNode.narrower.length &&
        (depth < this.dialogData.props.maxLevel || this.dialogData.props.maxLevel === 0)
          ? this.mapNarrower(notationNode.narrower, mapNarrowerDepth)
          : []
      );
    }

    return createVocabNode(
      notationNode.id,
      notationNode.prefLabel?.de || '',
      notationNode.notation || [],
      notationNode.description || '',
      notationNode.narrower &&
      (depth < this.dialogData.props.maxLevel || this.dialogData.props.maxLevel === 0)
        ? this.mapNarrower(notationNode.narrower, mapNarrowerDepth)
        : []
    );
  }

  private makeTree(vocab: VocabData): VocabNode[] {
    return (vocab.hasTopConcept ?? []).map(notationNode =>
      this.createTreeNodes(1, notationNode, this.treeDepth)
    );
  }

  private mapNarrower(
    nodes: NotationNode[],
    currentDepth: number
  ): VocabNode[] {
    const nextDepth = currentDepth + 1;

    return nodes.map((notationNode) =>
      this.createTreeNodes(nextDepth, notationNode, nextDepth)
    );
  }

  private initialize(): void {
    const vocabulary = this.metadataService.getVocabularies()
      .find((vocab) => vocab.url === this.dialogData.props.url);

    if (!vocabulary?.data) {
      console.warn(`Vocabulary data not found for URL: ${this.dialogData.props.url}`);
      this.dataChange.next([]);
      return;
    }

    this.treeDepth = this.getTreeDepth(vocabulary.data.hasTopConcept ?? []);
    const tree = this.makeTree(vocabulary.data);
    this.dataChange.next(tree);
  }
}
