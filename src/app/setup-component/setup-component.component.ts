import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-setup-component',
  templateUrl: './setup-component.component.html',
  styleUrls: ['./setup-component.component.scss'],
})
export class SetupComponent implements OnInit {
  constructor(
    public httpClient: HttpClient,
    private cookieService: CookieService,
    public dialogRef: MatDialogRef<SetupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    dialogRef.disableClose = true;
    this.csrftoken = this.cookieService.get('csrftoken');
    this.leetcodeSession = this.cookieService.get('LEETCODE_SESSION');
    this.gitpat = this.cookieService.get('git_pat');
  }

  csrftoken: string;
  leetcodeSession: string;
  gitpat: string;

  ngOnInit(): void {}

  onClose(): void {
    this.cookieService.set('LEETCODE_SESSION', this.leetcodeSession);
    this.cookieService.set('csrftoken', this.csrftoken);
    this.cookieService.set('git_pat', this.gitpat);
    this.dialogRef.close();
  }
}
