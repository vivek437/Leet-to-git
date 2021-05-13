import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'LeetCodeHub';
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

  @ViewChild(MatSort, { static: false }) sort: MatSort;

  constructor(
    public httpClient: HttpClient,
    private cookieService: CookieService,
    public dialog: MatDialog,
  ) {
    const sessionCookie =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfYXV0aF91c2VyX2lkIjoiMTExMTY1OCIsIl9hdXRoX3VzZXJfYmFja2VuZCI6ImFsbGF1dGguYWNjb3VudC5hdXRoX2JhY2tlbmRzLkF1dGhlbnRpY2F0aW9uQmFja2VuZCIsIl9hdXRoX3VzZXJfaGFzaCI6ImE4NDMwODI5MGM1YTIxNjYwNDRhMDUzNzNiOGRlODA2NGVhMjQ2MjQiLCJpZCI6MTExMTY1OCwiZW1haWwiOiJ2aXZla3ByYXNhZDM0NUBnbWFpbC5jb20iLCJ1c2VybmFtZSI6InZpdmVrcHJhc2FkMzQ1IiwidXNlcl9zbHVnIjoidml2ZWtwcmFzYWQzNDUiLCJhdmF0YXIiOiJodHRwczovL2Fzc2V0cy5sZWV0Y29kZS5jb20vdXNlcnMvdml2ZWtwcmFzYWQzNDUvYXZhdGFyXzE1MzY5MTUwNzIucG5nIiwicmVmcmVzaGVkX2F0IjoxNjIwNjc5MjA5LCJpcCI6IjE4NS4yMjEuNjkuNDciLCJpZGVudGl0eSI6IjcyNzY2YWIyYjFjODVhZjk4YWRiYmI5NjgzNjAwZmRmIiwic2Vzc2lvbl9pZCI6NzM3ODAwN30.MVeNKzk7rkmsmsuW2QrMa8TPAyUdpVsRw6yp4BERkMA';
    this.cookieService.set('LEETCODE_SESSION', sessionCookie);
    this.cookieService.set(
      'csrftoken',
      'wabTxR0Ce7QxnUASDaUJ6wcItnScijdLbTAd3xhRg4SdjGWCR2eBhwV1RKBaFPrU',
    );
    this.__GetUser();
  }

  ngOnInit() {
    this.__GetAllQuestion();
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
      this.__FetchSubmissionsOfProblem(solvedQuestion.slug).subscribe(
        (response: any) => {
          this.filteredInfo[solvedQuestion.internalId].submissions = response;
          this.__UpdateLatestSubmission(
            response.submissions_dump,
            solvedQuestion.internalId,
          );
          this.__DownloadSubmission(
            solvedQuestion.internalId,
            this.filteredInfo[solvedQuestion.internalId]
              .latestSuccessfulSubmission,
            solvedQuestion.slug,
          );
        },
      );
    } else {
      this.__DownloadSubmission(
        solvedQuestion.internalId,
        this.filteredInfo[solvedQuestion.internalId].latestSuccessfulSubmission,
        solvedQuestion.slug,
      );
    }
  }

  private __GetAllQuestion() {
    let headers = this.defaultHeaders;
    headers = headers.set('Access-Control-Allow-Origin', '*');
    this.httpClient
      .request('get', '/api/problems/algorithms/', {
        headers,
        withCredentials: true,
      })
      .subscribe((response: any) => {
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
        this.loading = false;
        this.dataSource.sort = this.sort;
      });
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

  private __DownloadSubmission(
    id: number,
    latestSubmission: string,
    slug: string,
  ) {
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
    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        const url = result + '/' + slug + '.java';
        if (this.filteredInfo[id].latestSuccessfulSubmission === undefined) {
          this.__FetchSubmissionsOfProblem(slug).subscribe((response: any) => {
            this.__UpdateLatestSubmission(response.submissions_dump, id);
            this.__PushToGithub(url, id);
          });
        } else {
          this.__PushToGithub(url, id);
        }
      }
    });
  }

  private __PushToGithub(url: string, id: number) {
    this.httpClient
      .request('PUT', url, {
        body: {
          message: 'message',
          content: btoa(this.filteredInfo[id].latestSuccessfulSubmission),
        },

        headers: this.__GetGitHubHeaders(),
      })
      .subscribe((x: any) => {
        console.log('pushed to github');
      });
  }

  private __GetUser() {
    this.httpClient
      .request('get', '/user', {
        headers: this.__GetGitHubHeaders(),
      })
      .subscribe((x: any) => {
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
      });
  }

  private __GetRepositories() {
    this.httpClient
      .request('get', '/user/repos', {
        headers: this.__GetGitHubHeaders(),
      })
      .subscribe((x: any) => {
        x.forEach((element) => {
          this.gitUser.repositories.push(element.name);
        });
      });
  }

  private __GetGitHubHeaders(): any {
    let headers = this.defaultHeaders;
    headers = headers.set('Authorization', 'token sample_token ');
    headers = headers.set('Access-Control-Allow-Origin', '*');
    return headers;
  }
}
