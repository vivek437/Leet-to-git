import { Component, OnInit, ViewChild } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Info } from './Model/Info';
import { CookieService } from 'ngx-cookie-service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FilteredInfo } from './Model/FilteredInfo';
import { SubmissionsDump } from './Model/Submissions';
import { QuestionTag } from './Model/QuestionTags';
import { MatDialog } from '@angular/material/dialog';
import { PushToGithubComponent } from './Dialog/PushToGithubDialog';
import { User } from './Model/User';
import { SetupComponent } from './setup-component/setup-component.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { retry, delay } from 'rxjs/operators';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { languages } from './Model/language';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { RestCallService } from './Services/rest-call-services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'LEET-TO-GIT';
  allQues: Info;

  gitUser: User = {
    id: undefined,
    name: undefined,
    owner: undefined,
    repository_private: undefined,
    repository_public: undefined,
    repositories: [],
  };

  filteredInfo: FilteredInfo[] = [];
  defaultHeaders = new HttpHeaders();
  displayedColumns: string[] = [
    'question_id',
    'question__title',
    'level',
    'status',
  ];
  dataSource: any;
  loading = true;
  INVALID_INFO = 'Invalid Github PAT or Invalid Leetcode Cookie';
  jszip = new JSZip();

  @ViewChild(MatSort, { static: false }) sort: MatSort;

  constructor(
    public httpClient: HttpClient,
    private cookieService: CookieService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private restCall: RestCallService,
  ) {
    this.matIconRegistry.addSvgIcon(
      'github',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/gitlogo.svg'),
    );
    this.matIconRegistry.addSvgIcon(
      'leetcode',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        '../assets/leetcode-logo.svg',
      ),
    );
  }

  ngOnInit() {
    const session = this.cookieService.get('LEETCODE_SESSION');
    const csrftoken = this.cookieService.get('csrftoken');
    const gitpat = this.cookieService.get('git_pat');
    if (csrftoken === '' || session === '' || gitpat === '') {
      const dialogRef = this.dialog.open(SetupComponent, {
        width: '700px',
        data: {},
      });

      dialogRef.afterClosed().subscribe((result) => {
        this.__GetGithubUser();
        this.__GetLeetCodeUserProfile();
      });
    } else {
      this.__GetGithubUser();
      this.__GetLeetCodeUserProfile();
    }
  }

  redirectToLeetCode(filteredInfo: FilteredInfo) {
    window.open(
      'https://leetcode.com/problems/' + filteredInfo.question__title_slug,
      '_blank',
    );
  }

  public downloadAll() {
    const solvedList = [];
    this.filteredInfo.forEach((item) => {
      if (item.status === 'Solved') {
        solvedList.push({
          internalId: item.internalId,
          slug: item.question__title_slug,
        });
      }
    });

    this.jszip = new JSZip();
    this.__openSnackBar('Generating Zip Download will start soon');
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.downloadSubmission(solvedList[i], {
          curr: i,
          total: 4,
        });
      }, (i + 1) * 3000);
    }
  }

  public downloadSubmission(subs: any, data?: any) {
    if (
      this.filteredInfo[subs.internalId].latestSuccessfulSubmission ===
      undefined
    ) {
      this.restCall
        .__FetchSubmissions(subs.slug)
        .pipe(
          retry(3), // you retry 3 times
          delay(5000), // each retry will start after 5 second,
        )
        .subscribe(
          (res: any) => {
            this.filteredInfo[subs.internalId].submissions = res;
            this.__UpdateLatestSubmission(
              res.submissions_dump,
              subs.internalId,
            );
            this.__DownloadSubmission(
              this.filteredInfo[subs.internalId].latestSuccessfulSubmission,
              subs.slug,
              data,
            );
          },
          (err: HttpErrorResponse) => {},
        );
    } else {
      this.__DownloadSubmission(
        this.filteredInfo[subs.internalId].latestSuccessfulSubmission,
        subs.slug,
        data,
      );
    }
  }

  private __DownloadSubmission(sub: SubmissionsDump, slug: string, data?: any) {
    const fileName = slug + languages[sub.lang];
    if (data !== undefined) {
      this.jszip.file(fileName, sub.code);
      if (data.curr + 1 === data.total) {
        this.jszip.generateAsync({ type: 'blob' }).then((content) => {
          saveAs(content, 'LeetCode-Solved.zip');
        });
      }
    } else {
      const bb = new Blob([sub.code], { type: 'text/plain;' });
      const a = document.createElement('a');
      a.download = fileName;
      a.href = window.URL.createObjectURL(bb);
      a.click();
    }
  }

  openDialog(filteredInfo: FilteredInfo): void {
    if (filteredInfo.questionTag === undefined) {
      this.restCall
        .__FetchQuestionTag(filteredInfo.question__title_slug)
        .subscribe((x: QuestionTag) => {
          this.filteredInfo[filteredInfo.internalId].questionTag = x;
          this._Open(filteredInfo.internalId);
        });
    } else {
      this._Open(filteredInfo.internalId);
    }
  }

  // Open Dialog For Pushing To Github
  private _Open(id: number) {
    const slug = this.filteredInfo[id].question__title_slug;
    const dialogRef = this.dialog.open(PushToGithubComponent, {
      width: '400px',
      data: {
        tags: this.filteredInfo[id].questionTag,
        user: this.gitUser,
        slug: this.filteredInfo[id].question__title_slug,
      },
    });
    dialogRef.afterClosed().subscribe(
      (result) => {
        if (result !== undefined) {
          const url =
            result + '/' + this.filteredInfo[id].question_id + '-' + slug;
          if (this.filteredInfo[id].latestSuccessfulSubmission === undefined) {
            this.restCall.__FetchSubmissions(slug).subscribe(
              (response: any) => {
                this.__UpdateLatestSubmission(response.submissions_dump, id);
                this.__PushToGithub(url, id);
              },
              (err) => {
                this.__clearCookieAndRedirect(this.INVALID_INFO);
              },
            );
          } else {
            this.__PushToGithub(url, id);
          }
        }
      },
      (err) => {
        this.__clearCookieAndRedirect(this.INVALID_INFO);
      },
    );
  }

  private __PushToGithub(url: string, id: number) {
    url =
      url + languages[this.filteredInfo[id].latestSuccessfulSubmission.lang];
    this.restCall.__PushToGithub(url, id, this.filteredInfo).subscribe(
      (res: any) => {
        this.__openSnackBar('Successful Pushed to Github');
      },
      (err: HttpErrorResponse) => {
        if (err.status === 401 || err.status === 403) {
          this.__clearCookieAndRedirect(this.INVALID_INFO);
        } else if (err.status === 422) {
          this.__openSnackBar('Github already contains this solution!!');
        } else {
          this.__openSnackBar('Internal Server Error!! Try Again Later!!');
        }
      },
    );
  }

  private __openSnackBar(message: string) {
    this.snackBar.open(message, '', {
      duration: 3000,
    });
  }

  private __GetGithubUser() {
    this.restCall.__GetGithubUser().subscribe(
      (x: any) => {
        this.gitUser.id = x.id;
        this.gitUser.name = x.name;
        this.gitUser.owner = x.login;
        this.gitUser.repository_private = x.total_private_repos;
        this.gitUser.repository_public = x.public_repos;
        this.__GetGitRepositories();
      },
      (err) => {
        this.__clearCookieAndRedirect(this.INVALID_INFO);
      },
    );
  }

  private __clearCookieAndRedirect(message: string) {
    this.__openSnackBar(message);
    this.cookieService.deleteAll();
    window.location.reload();
  }

  private __GetGitRepositories() {
    this.restCall.__GetRepositories().subscribe(
      (res: any) => {
        res.forEach((element) => {
          this.gitUser.repositories.push(element.name);
        });
      },
      (err) => {
        this.__clearCookieAndRedirect(this.INVALID_INFO);
      },
    );
  }

  private __GetLeetCodeUserProfile() {
    this.restCall.__GetLeetCodeUserProfile().subscribe(
      (response: any) => {
        if (response.user_name === '') {
          this.__clearCookieAndRedirect(this.INVALID_INFO);
        } else {
          this.allQues = response;
          let i = 0;
          this.allQues.stat_status_pairs.forEach((item) => {
            this.filteredInfo[i] = {
              internalId: i,
              question_id: item.stat.question_id,
              question__title: item.stat.question__title,
              question__title_slug: item.stat.question__title_slug,
              status: item.status === 'ac' ? 'Solved' : 'Unsolved',
              level:
                item.difficulty.level === 1
                  ? 'Easy'
                  : item.difficulty.level === 2
                  ? 'Medium'
                  : 'Hard',
            };
            i++;
          });
          this.dataSource = new MatTableDataSource(this.filteredInfo);
          this.dataSource.sort = this.sort;
          this.loading = false;
        }
      },
      (err) => {
        this.__clearCookieAndRedirect(this.INVALID_INFO);
      },
    );
  }

  private __UpdateLatestSubmission(subs: SubmissionsDump[], id: number) {
    subs.forEach((item) => {
      if (item.status_display === 'Accepted') {
        this.filteredInfo[id].latestSuccessfulSubmission = item;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
