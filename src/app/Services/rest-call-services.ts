import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { FilteredInfo } from '../Model/FilteredInfo';
import { languages } from '../Model/language';

@Injectable()
export class RestCallService {
  defaultHeaders = new HttpHeaders();

  constructor(
    public httpClient: HttpClient,
    private cookieService: CookieService,
  ) {}

  private __GetGitHubHeaders(): any {
    let headers = this.defaultHeaders;
    const token = this.cookieService.get('git_pat');
    headers = headers.set('Authorization', 'token ' + token);
    headers = headers.set('Access-Control-Allow-Origin', '*');
    return headers;
  }

  public __GetLeetCodeUserProfile() {
    let headers = this.defaultHeaders;
    headers = headers.set('Access-Control-Allow-Origin', '*');
    return this.httpClient.request('get', '/api/problems/algorithms/', {
      headers,
      withCredentials: true,
    });
  }

  public __GetLeetCodeQuestionTags() {
    let headers = this.defaultHeaders;
    headers = headers.set('Access-Control-Allow-Origin', '*');
    return this.httpClient.request('get', '/problems/api/tags/', {
      headers,
      withCredentials: true,
    });
  }

  public __GetRepositories() {
    return this.httpClient.request('get', '/user/repos', {
      headers: this.__GetGitHubHeaders(),
    });
  }

  public __GetGithubUser() {
    return this.httpClient.request('get', '/user', {
      headers: this.__GetGitHubHeaders(),
    });
  }

  public __PushToGithub(url: string, id: number, filteredInfo: FilteredInfo[]) {
    return this.httpClient.request('PUT', url, {
      body: {
        message:
          filteredInfo[id].question_id + '-' + filteredInfo[id].question__title,
        content: btoa(filteredInfo[id].latestSuccessfulSubmission.code),
      },
      headers: this.__GetGitHubHeaders(),
    });
  }

  public __FetchSubmissions(slug: string) {
    let headers = this.defaultHeaders;
    headers = headers.set('Access-Control-Allow-Origin', '*');
    return this.httpClient.request('get', '/api/submissions/' + slug, {
      headers,
      withCredentials: true,
    });
  }

  // public __FetchQuestionTag(slug: string) {
  //   let headers = this.defaultHeaders;
  //   headers = headers.set('Access-Control-Allow-Origin', '*');
  //   const body = {
  //     query: [
  //       'query getQuestionDetail($titleSlug: String!) {',
  //       '  question(titleSlug: $titleSlug) {',
  //       '    topicTags {',
  //       '        name',
  //       '        slug',
  //       '        translatedName',
  //       '          __typename',
  //       '       }',
  //       '  }',
  //       '}',
  //     ].join('\n'),
  //     variables: { titleSlug: slug },
  //     operationName: 'getQuestionDetail',
  //   };

  //   return this.httpClient.request('post', '/graphql/' + slug, {
  //     body,
  //     headers,
  //     withCredentials: true,
  //   });
  // }
}
