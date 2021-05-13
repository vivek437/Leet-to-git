import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../Model/User';
@Component({
  selector: 'app-push-github',
  templateUrl: 'PushToGithubDialog.html',
  styleUrls: ['./PushToGithubDialog.scss'],
})
export class PushToGithubComponent {
  constructor(
    public httpClient: HttpClient,
    public dialogRef: MatDialogRef<PushToGithubComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    console.log(data);
  }

  defaultHeaders = new HttpHeaders();
  selectedBucket: string = undefined;
  selectedRepo: string = undefined;

  onNoClick(): void {
    this.dialogRef.close(undefined);
  }

  pushToGit() {
    const url =
      '/repos/' +
      this.data.user.owner +
      '/' +
      this.selectedRepo +
      '/contents/' +
      this.selectedBucket;
    this.dialogRef.close(url);
  }
}
