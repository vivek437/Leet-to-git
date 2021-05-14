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
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'LEET-TO-GIT';
  info: Info;
  gitUser: User;
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

  @ViewChild(MatSort, { static: false }) sort: MatSort;

  constructor(
    public httpClient: HttpClient,
    private cookieService: CookieService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

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

  public downloadAllSolvedSolution() {
    const solvedQuestion = [];
    this.filteredInfo.forEach((item) => {
      if (item.status === 'Solved') {
        solvedQuestion.push({
          internalId: item.internalId,
          slug: item.question__title_slug,
        });
      }
    });

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < solvedQuestion.length; i++) {
      setTimeout(() => {
        this.downloadSpecificSolution(solvedQuestion[i]);
      }, (i + 1) * 3000);
    }
  }

  public downloadSpecificSolution(solvedQuestion: any) {
    if (
      this.filteredInfo[solvedQuestion.internalId]
        .latestSuccessfulSubmission === undefined
    ) {
      this.__FetchSubmissionsOfProblem(solvedQuestion.slug)
        .pipe(
          retry(3), // you retry 3 times
          delay(5000), // each retry will start after 1 second,
        )
        .subscribe(
          (response: any) => {
            this.filteredInfo[solvedQuestion.internalId].submissions = response;
            this.__UpdateLatestSubmission(
              response.submissions_dump,
              solvedQuestion.internalId,
            );
            this.__DownloadSubmission(
              this.filteredInfo[solvedQuestion.internalId]
                .latestSuccessfulSubmission,
              solvedQuestion.slug,
            );
          },
          (err: HttpErrorResponse) => {},
        );
    } else {
      this.__DownloadSubmission(
        this.filteredInfo[solvedQuestion.internalId].latestSuccessfulSubmission,
        solvedQuestion.slug,
      );
    }
  }

  private __GetLeetCodeUserProfile() {
    let headers = this.defaultHeaders;
    headers = headers.set('Access-Control-Allow-Origin', '*');
    this.httpClient
      .request('get', '/api/problems/algorithms/', {
        headers,
        withCredentials: true,
      })
      .subscribe(
        (response: any) => {
          if (response.user_name === '') {
            this.__clearCookieAndRedirect(this.INVALID_INFO);
          } else {
            this.info = response;
            let i = 0;
            this.info.stat_status_pairs.forEach((item) => {
              this.filteredInfo[i] = {
                internalId: i,
                question_id: item.stat.question_id,
                question__title: item.stat.question__title,
                question__title_slug: item.stat.question__title_slug,
                status: item.status === 'ac' ? 'Solved' : 'Unsolved',
                level: item.difficulty.level,
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

  private __FetchSubmissionsOfProblem(slug: string) {
    let headers = this.defaultHeaders;
    headers = headers.set('Access-Control-Allow-Origin', '*');
    return this.httpClient.request('get', '/api/submissions/' + slug, {
      headers,
      withCredentials: true,
    });
  }

  private __UpdateLatestSubmission(submissions: SubmissionsDump[], id: number) {
    submissions.forEach((item) => {
      if (item.status_display === 'Accepted') {
        this.filteredInfo[id].latestSuccessfulSubmission = item.code;
      }
    });
  }

  private __DownloadSubmission(latestSubmission: string, slug: string) {
    const bb = new Blob([latestSubmission], { type: 'text/plain;' });
    const a = document.createElement('a');
    a.download = slug;
    a.href = window.URL.createObjectURL(bb);
    a.click();
  }

  private __FetchQuestionTag(slug: string) {
    let headers = this.defaultHeaders;
    headers = headers.set('Access-Control-Allow-Origin', '*');
    const body = {
      query: [
        'query getQuestionDetail($titleSlug: String!) {',
        '  question(titleSlug: $titleSlug) {',
        '    topicTags {',
        '        name',
        '        slug',
        '        translatedName',
        '          __typename',
        '       }',
        '  }',
        '}',
      ].join('\n'),
      variables: { titleSlug: slug },
      operationName: 'getQuestionDetail',
    };

    return this.httpClient.request('post', '/graphql/' + slug, {
      body,
      headers,
      withCredentials: true,
    });
  }

  openDialog(filteredInfo: FilteredInfo): void {
    if (filteredInfo.questionTag === undefined) {
      this.__FetchQuestionTag(filteredInfo.question__title_slug).subscribe(
        (x: QuestionTag) => {
          this.filteredInfo[filteredInfo.internalId].questionTag = x;
          this._Open(filteredInfo.internalId);
        },
      );
    } else {
      this._Open(filteredInfo.internalId);
    }
  }

  private _Open(id: number) {
    const slug = this.filteredInfo[id].question__title_slug;
    const dialogRef = this.dialog.open(PushToGithubComponent, {
      width: '400px',
      data: { tags: this.filteredInfo[id].questionTag, user: this.gitUser },
    });
    dialogRef.afterClosed().subscribe(
      (result) => {
        if (result !== undefined) {
          const url = result + '/' + slug + '.java';
          if (this.filteredInfo[id].latestSuccessfulSubmission === undefined) {
            this.__FetchSubmissionsOfProblem(slug).subscribe(
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
    this.httpClient
      .request('PUT', url, {
        body: {
          message: this.filteredInfo[id].question__title,
          content: btoa(this.filteredInfo[id].latestSuccessfulSubmission),
        },

        headers: this.__GetGitHubHeaders(),
      })
      .subscribe(
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
    this.httpClient
      .request('get', '/user', {
        headers: this.__GetGitHubHeaders(),
      })
      .subscribe(
        (x: any) => {
          this.gitUser = {
            id: undefined,
            name: undefined,
            owner: undefined,
            repository_private: undefined,
            repository_public: undefined,
            repositories: [],
          };
          this.gitUser.id = x.id;
          this.gitUser.name = x.name;
          this.gitUser.owner = x.login;
          this.gitUser.repository_private = x.total_private_repos;
          this.gitUser.repository_public = x.public_repos;
          this.__GetRepositories();
        },
        (err) => {
          this.__clearCookieAndRedirect('message');
        },
      );
  }

  private __clearCookieAndRedirect(message: string) {
    this.__openSnackBar(message);
    this.cookieService.deleteAll();
    window.location.reload();
  }

  private __GetRepositories() {
    this.httpClient
      .request('get', '/user/repos', {
        headers: this.__GetGitHubHeaders(),
      })
      .subscribe(
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

  private __GetGitHubHeaders(): any {
    let headers = this.defaultHeaders;
    const token = this.cookieService.get('git_pat');
    headers = headers.set('Authorization', 'token ' + token);
    headers = headers.set('Access-Control-Allow-Origin', '*');
    return headers;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
