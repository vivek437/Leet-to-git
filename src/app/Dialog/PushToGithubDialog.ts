import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
@Component({
  selector: 'app-push-github',
  templateUrl: 'PushToGithubDialog.html',
  styleUrls: ['./PushToGithubDialog.scss'],
})
export class PushToGithubComponent {
  constructor(
    public dialogRef: MatDialogRef<PushToGithubComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    console.log(data);
  }

  selectedTag: string = undefined;

  onNoClick(): void {
    this.dialogRef.close();
  }

  pushToGit() {
    console.log('Pushed with tag', this.selectedTag);
    this.dialogRef.close();
  }
}
