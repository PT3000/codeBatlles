# CodeBattles

CodeBattles는 로그인한 사용자가 1:1로 매칭되어 같은 알고리즘 문제를 풀고, 먼저 정답 판정을 받은 사용자가 승리하는 실시간 코드 배틀 플랫폼입니다.

프론트엔드는 HTML/CSS/Vanilla JavaScript로 구성되어 있고, 백엔드는 FastAPI가 정적 페이지, REST API, WebSocket을 함께 제공합니다. 채점은 Judge0 API를 우선 사용하며, Judge0 연결이 실패하면 개발/배포 환경에서 사용할 수 있는 로컬 subprocess 채점기로 폴백합니다.

## 현재 구현 상태

- 회원가입, 로그인, 로그아웃
- JWT 기반 인증 및 관리자 권한 검사
- 공통 네비게이션 바 분리
- 자동 매칭 및 특정 사용자 배틀 신청
- 로비 WebSocket, 배틀방 WebSocket
- 배틀 시작 카운트다운, 배틀 종료 이벤트
- 배틀 화면의 실시간 상대 코드 공유
- 코드 제출 및 채점
- Judge0 우선 채점, 로컬 채점기 폴백
- 승패 기록, 결과 화면, 랭킹 화면
- 관리자 문제 ZIP 업로드
- 관리자 문제 목록 조회, 문제 soft delete
- 테스트케이스 목록 조회 및 개별 삭제

현재 코드 입력 영역은 Monaco Editor가 아니라 `textarea` 기반입니다. Monaco Editor는 문서상 계획에 포함되어 있으나, 실제 적용은 추가 구현이 필요합니다.

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Frontend | HTML5, CSS, Vanilla JavaScript, Tailwind CDN |
| Backend | Python 3.14.x, FastAPI 0.136.1 |
| ASGI Server | Uvicorn 0.46.0 |
| Realtime | WebSocket |
| Database | MySQL |
| ORM | SQLAlchemy 2.0 Async ORM |
| DB Driver | aiomysql |
| Auth | JWT, bcrypt |
| Judge Engine | Judge0 CE v1.13.1, LocalExecutor fallback |
| Deployment | Render 기준 구성 |

## 프로젝트 구조

```text
codeBattles/
  frontend/
    index.html
    components/
      guest-navbar.html
      user-navbar.html
      admin-navbar.html
      battle-navbar.html
    pages/
      login.html
      register.html
      main.html
      matching.html
      battle.html
      result.html
      history.html
      history_detail.html
      ranking.html
      settings.html
      admin-problems.html
    css/
    js/
    assets/
    vendor/

  backend/
    app/
      auth/
      models/
      schemas/
      routers/
      services/
      repositories/
      utils/
      main.py
      database.py
      config.py
    .env
    .env.example
    requirements.txt

  judge0-v1.13.1/
    docker-compose.yml
    judge0.conf

  testcase/
  상세구현.md
  README.md
```

## 실행 방법

### 1. 가상환경 생성 및 패키지 설치

```powershell
cd C:\Users\okay3\Desktop\작업\codeBattles\backend
py -3.14 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

이미 가상환경이 있다면 활성화만 하면 됩니다.

```powershell
cd C:\Users\okay3\Desktop\작업\codeBattles\backend
.\.venv\Scripts\Activate.ps1
```

### 2. 환경변수 설정

`backend/.env.example`을 참고해 `backend/.env`를 준비합니다.

```env
DATABASE_URL=mysql+aiomysql://root:your_db_password@localhost:3306/codebattles
DB_SSL_CA=

SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

JUDGE0_URL=http://localhost:2358
```

로컬 MySQL은 보통 `DB_SSL_CA`를 비워둡니다. Render 등 배포 환경에서 SSL 인증서가 필요하면 해당 경로를 설정합니다.

### 3. FastAPI 서버 실행

```powershell
cd C:\Users\okay3\Desktop\작업\codeBattles\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

접속 주소:

```text
http://127.0.0.1:8000
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/api/health
```

## 주요 페이지 라우팅

FastAPI가 프론트엔드 HTML 파일을 `FileResponse`로 제공합니다.

| URL | 화면 |
| --- | --- |
| `/` | 첫 진입 페이지 |
| `/login` | 로그인 |
| `/register` | 회원가입 |
| `/main` | 로그인 후 메인 |
| `/matching` | 자동/특정 사용자 매칭 대기 |
| `/battle?battle_id={id}` | 1:1 배틀 |
| `/result?battle_id={id}` | 배틀 결과 |
| `/history` | 배틀 기록 |
| `/history-detail` | 기록 상세 |
| `/ranking` | 랭킹 |
| `/settings` | 설정 |
| `/admin-problems` | 관리자 문제 설정 |

정적 파일은 다음 경로로 제공됩니다.

```text
/css
/js
/assets
/components
/vendor
```

## 인증 방식

현재 구현은 JWT 기반 인증입니다.

```text
로그인 성공
-> access_token 발급
-> 프론트엔드가 sessionStorage 또는 localStorage에 저장
-> API 요청 시 Authorization: Bearer <token> 헤더 전송
-> FastAPI가 토큰을 검증해 현재 사용자 확인
```

비밀번호는 bcrypt 해시로 저장합니다. 관리자 API는 프론트 메뉴 표시만으로 제한하지 않고, 백엔드의 `get_current_admin` 의존성에서 실제 권한을 검사합니다.

## 주요 API

### Auth

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/auth/register` | 회원가입 |
| POST | `/auth/login` | 로그인 및 JWT 발급 |
| POST | `/auth/logout` | 로그아웃 |
| GET | `/auth/me` | 현재 로그인 사용자 |

### Users

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/users/me` | 내 정보 |
| GET | `/users/me/battle-state` | 내 배틀 상태 |
| POST | `/users/me/forfeit` | 진행 중인 배틀 기권 |
| GET | `/users/online` | 온라인 사용자 |
| GET | `/users/me/history` | 내 배틀 기록 |
| GET | `/users/leaderboard` | 랭킹 |

### Match

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/match/queue` | 자동 매칭 대기열 등록 |
| DELETE | `/match/queue` | 자동 매칭 취소 |
| GET | `/match/requests/pending` | 받은 배틀 신청 목록 |
| POST | `/match/request` | 특정 사용자 배틀 신청 |
| DELETE | `/match/request/{request_id}` | 배틀 신청 취소 |
| POST | `/match/request/{request_id}/accept` | 배틀 신청 수락 |
| POST | `/match/request/{request_id}/reject` | 배틀 신청 거절 |

### Battles

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/battles/{battle_id}` | 배틀 정보 |
| POST | `/battles/{battle_id}/submit` | 코드 제출 |
| GET | `/battles/{battle_id}/result` | 배틀 결과 |
| GET | `/battles/{battle_id}/submissions` | 배틀 제출 기록 |

### Problems

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/problems` | 활성 문제 목록 |
| GET | `/problems/random` | 랜덤 문제 |
| GET | `/problems/{problem_id}` | 문제 상세 |
| GET | `/problems/{problem_id}/test-cases` | 테스트케이스 목록 |
| POST | `/problems` | 문제 생성, 관리자 전용 |
| POST | `/problems/{problem_id}/test-cases` | 테스트케이스 추가, 관리자 전용 |
| DELETE | `/problems/{problem_id}/test-cases/{test_case_id}` | 테스트케이스 삭제, 관리자 전용 |
| POST | `/problems/{problem_id}/test-cases/upload` | 테스트케이스 ZIP 업로드, 관리자 전용 |
| DELETE | `/problems/{problem_id}` | 문제 soft delete, 관리자 전용 |

### Admin

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/admin/stats` | 관리자 통계 |
| GET | `/admin/users` | 전체 사용자 목록 |
| PATCH | `/admin/users/{user_id}/role` | 사용자 역할 변경 |
| PATCH | `/admin/users/{user_id}/active` | 사용자 활성 상태 변경 |
| GET | `/admin/problems` | 관리자 문제 목록, 삭제된 문제 제외 |
| PATCH | `/admin/problems/{problem_id}/restore` | 삭제된 문제 복구 |
| DELETE | `/admin/problems/{problem_id}` | 문제 soft delete |
| POST | `/admin/problems/import-zip` | 문제와 테스트케이스 ZIP 일괄 등록 |

## WebSocket

| Path | 용도 |
| --- | --- |
| `/ws/lobby?token={access_token}` | 로비 이벤트, 자동 매칭, 배틀 신청/수락/거절 |
| `/ws/battles/{battle_id}?token={access_token}` | 배틀방 이벤트, 카운트다운, 코드 공유, 배틀 종료 |

배틀 화면에서는 코드 입력 변경을 `code_update` 이벤트로 보내고, 서버는 같은 `battle_id`에 접속한 상대에게 전달합니다.

## 채점 구조

채점은 다음 순서로 진행됩니다.

```text
사용자 코드 제출
-> FastAPI가 battle_id로 문제와 테스트케이스 조회
-> Judge0 API 호출 시도
-> Judge0 성공 시 Judge0 결과 사용
-> Judge0 연결 실패/5xx/타임아웃 시 LocalExecutor 폴백
-> 모든 테스트케이스 통과 시 Accepted
-> submissions 저장
-> 승자 기록 및 WebSocket battle_end 전송
```

LocalExecutor는 현재 환경에서 사용 가능한 런타임을 기준으로 `python`, `c`, `cpp`, `java` 지원 여부를 판단합니다. 로컬 채점기는 실행 시간은 합산해 저장하지만, 메모리 사용량은 정확히 측정하지 않으므로 결과 화면에서 `측정 안 됨`으로 표시합니다.

## Judge0 실행

Judge0 CE v1.13.1은 `judge0-v1.13.1` 폴더에서 Docker Compose로 실행할 수 있습니다.

```powershell
cd C:\Users\okay3\Desktop\작업\codeBattles\judge0-v1.13.1
docker compose up -d
```

동작 확인:

```text
http://localhost:2358/languages
```

언어 ID 예시:

| 언어 | language_id |
| --- | --- |
| Python 3 | 71 |
| C | 50 |
| C++ | 54 |
| Java | 62 |
| JavaScript | 63 |
| TypeScript | 74 |

주의: Windows Docker Desktop/WSL 환경에서는 Judge0의 내부 샌드박스가 cgroup 설정과 충돌할 수 있습니다. 이 경우 `/languages`는 열리더라도 실제 `/submissions` 실행에서 Internal Error가 발생할 수 있습니다.

## 문제 ZIP 업로드 형식

관리자 페이지에서 ZIP 파일 하나로 문제와 테스트케이스를 등록할 수 있습니다.

```text
problem-dataset.zip
  problem.json
  cases/
    1.in
    1.out
    2.in
    2.out
    sample_1.in
    sample_1.out
```

`problem.json` 예시:

```json
{
  "title": "A+B",
  "description": "두 정수 A와 B를 입력받아 A+B를 출력하세요.",
  "input_description": "첫째 줄에 두 정수 A와 B가 공백으로 구분되어 주어진다.",
  "output_description": "첫째 줄에 A+B를 출력한다.",
  "difficulty": "easy",
  "time_limit": 2,
  "memory_limit": 128,
  "sample_input": "1 2",
  "sample_output": "3"
}
```

현재 `sample_input`, `sample_output`은 `problem.json`에 직접 넣어야 배틀 화면의 예제 입력/출력 영역에 표시됩니다. `sample_1.in`, `sample_1.out`은 테스트케이스의 예제 여부를 표시하는 데 사용됩니다.

## DB 개요

주요 테이블:

| 테이블 | 설명 |
| --- | --- |
| `users` | 사용자, 역할, 승패, 접속 상태 |
| `problems` | 문제 제목, 설명, 제한, 예제 |
| `test_cases` | 문제별 입력/기대 출력 |
| `match_queue` | 자동 매칭 대기열 |
| `battle_requests` | 특정 사용자 배틀 신청 |
| `battles` | 1:1 배틀 정보, 승자, 상태 |
| `submissions` | 제출 코드와 채점 결과 |

관계 요약:

```text
users 1:N match_queue
users 1:N battle_requests
users 1:N submissions
users 1:N battles(player1/player2/winner)
problems 1:N test_cases
problems 1:N battles
problems 1:N submissions
battles 1:N submissions
```

## 현재 한계

- Monaco Editor는 아직 실제 적용되지 않았고 textarea 기반입니다.
- Judge0는 환경에 따라 Docker/cgroup 이슈가 있을 수 있습니다.
- 로컬 채점기는 개발/시연용 폴백이며, 메모리 사용량을 정확히 측정하지 않습니다.
- 관리자 문제 수정 기능은 아직 구현되지 않았고, ZIP 업로드/삭제/테스트케이스 삭제 중심으로 동작합니다.
- 운영 수준의 보안 격리와 대규모 동시성 처리는 추가 개선이 필요합니다.

## 참고

상세 설계와 발표용 설명은 `상세구현.md`를 참고합니다.
