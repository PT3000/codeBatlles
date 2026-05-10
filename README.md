# CodeBattles

실시간 1:1 코드 배틀 플랫폼입니다. 사용자는 로그인 후 자동 매칭 또는 특정 사용자 배틀 신청을 통해 같은 문제를 풀고, 먼저 정답 판정을 받은 사용자가 승리합니다.

## 빠른 시작

저장소를 처음 받은 뒤 백엔드 가상환경을 생성하고 패키지를 설치합니다.

```powershell
cd backend
py -3.14 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

FastAPI 개발 서버 실행:

```powershell
uvicorn app.main:app --reload
```

접속 확인:

```text
http://127.0.0.1:8000
http://127.0.0.1:8000/docs
```

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Frontend | HTML, CSS, JavaScript, Monaco Editor |
| Backend | Python, FastAPI |
| Realtime | WebSocket |
| Database | MySQL |
| ORM | SQLAlchemy |
| Auth | FastAPI Users, 세션 기반 로그인 |
| Judge Engine | Judge0 CE |
| Container | Docker, Docker Compose |

## 프로젝트 구조

```text
codeBattles/
  frontend/
    index.html
    components/
      navbar.html
    pages/
      login.html
      register.html
      main.html
      matching.html
      battle.html
      result.html
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
    .env
    .env.example
    requirements.txt

  judge0-v1.13.1/
    docker-compose.yml
    judge0.conf

  상세구현.md
  README.md
```

## 주요 기능

- 회원가입, 로그인, 로그아웃
- 세션 기반 인증
- 사용자 역할 구분: `user`, `admin`
- 자동 매칭
- 특정 사용자 배틀 신청
- WebSocket 기반 실시간 코드 공유
- Monaco Editor 기반 코드 작성
- Judge0 CE 기반 코드 채점
- 관리자 문제 등록
- 테스트케이스 등록
- 배틀 결과 및 승패 기록 저장

## 인증 방식

로그인은 JWT가 아니라 세션 방식으로 처리합니다.

```text
로그인 성공
-> user_sessions 테이블에 세션 저장
-> 브라우저에 session_id 쿠키 발급
-> 요청마다 session_id 쿠키로 로그인 확인
-> 로그아웃 시 user_sessions에서 세션 삭제
```

비밀번호는 `bcrypt`로 암호화하여 저장합니다.

## Judge0 실행

Judge0 CE는 Docker Compose로 실행합니다.

`judge0-v1.13.1/judge0.conf`에는 Redis/PostgreSQL 비밀번호가 들어가므로 Git에는 올리지 않고 로컬에서 관리합니다.

```powershell
cd C:\Users\okay3\Desktop\codeBattles\judge0-v1.13.1
docker compose up -d
```

실행 확인:

```text
http://localhost:2358/languages
```

언어 목록 JSON이 나오면 Judge0 서버가 정상 실행된 것입니다.

주요 언어 ID:

| 언어 | language_id |
| --- | --- |
| Python 3 | 71 |
| C | 50 |
| C++ | 54 |
| Java | 62 |
| JavaScript | 63 |
| TypeScript | 74 |

## Judge0 채점 흐름

```text
사용자 코드 제출
-> FastAPI가 problem_id로 테스트케이스 조회
-> Judge0 /submissions API 호출
-> Judge0가 코드 실행 및 채점
-> FastAPI가 결과 확인
-> 모든 테스트케이스가 Accepted면 승리 처리
-> WebSocket으로 양쪽 사용자에게 결과 전송
```

Judge0 요청 예시:

```json
{
  "source_code": "a, b = map(int, input().split())\nprint(a + b)",
  "language_id": 71,
  "stdin": "1 2",
  "expected_output": "3"
}
```

## 개발 방식

개발 초기에는 Apache 없이 FastAPI가 프론트엔드 정적 파일, API, WebSocket을 함께 제공합니다. 기능 구현이 완료된 뒤 필요하면 Apache를 추가하여 정적 파일 제공과 `/api`, `/ws` 프록시 역할을 맡깁니다.

## FastAPI 실행

백엔드 개발 서버는 `backend` 폴더에서 실행합니다.

```powershell
cd C:\Users\okay3\Desktop\codeBattles\backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

가상환경을 활성화하지 않고 실행하려면 다음 명령을 사용할 수 있습니다.

```powershell
cd C:\Users\okay3\Desktop\codeBattles\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

실행 확인:

```text
http://127.0.0.1:8000
http://127.0.0.1:8000/docs
```

`/docs`에서는 FastAPI가 자동 생성한 API 문서를 확인할 수 있습니다.

## 화면 구성

- `index.html`: 첫 진입 및 서비스 소개 화면
- `login.html`: 로그인 화면
- `register.html`: 회원가입 화면
- `main.html`: 로그인 후 로비 화면
- `matching.html`: 자동 매칭 대기 화면
- `battle.html`: 1:1 실시간 코드 배틀 화면
- `result.html`: 배틀 결과 화면
- `admin-problems.html`: 관리자 문제 관리 화면

## 참고 문서

상세 기능 명세와 DB/API 설계는 `상세구현.md`를 참고합니다.
