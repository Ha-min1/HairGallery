# SQL Query Logs & Backups

This directory contains local SQL query logs, backups, and migration snippets used in this project.
These `.sql` files are excluded from Git to prevent credential, schema, or personal data leakage in public/shared git history.

## SQL Files Index

| Filename | Date | Purpose / Description | Status |
| :--- | :--- | :--- | :--- |
| [sql_01_secure_reservations_rls.sql](file:///workspaces/HairGallery/sql/sql_01_secure_reservations_rls.sql) | 2026-07-15 | Drop public `reservations` RLS policies and apply strict owner-bound & admin-only policies. | Applied |
| [sql_02_prevent_role_hijacking.sql](file:///workspaces/HairGallery/sql/sql_02_prevent_role_hijacking.sql) | 2026-07-15 | Prevent normal users from escalating their role to 'ADMIN' via client-side API updates. | Applied |

---

## 🛡️ Security Architecture Improvements (보안 고도화 요약)

2026년 7월 15일부로 진행된 데이터베이스 및 API 보안 취약점 패치 내역입니다.

### 1. 개인정보 노출 원천 차단 (RLS SELECT 제한)
* **적용 파일**: `sql_01_secure_reservations_rls.sql`
* **설명**: 기존 `Reservations read public (USING true)` 정책으로 인해 클라이언트 브라우저에서 전체 예약자 명단(이름, 휴대폰 번호)을 파싱할 수 있던 문제를 제거했습니다.
* **조치**: 일반 회원은 본인 예약만 조회 가능하고, 달력 렌더링용 익명화 슬롯 조회는 서버 API route (`GET /api/bookings`)가 Service Key로 대리 처리하도록 우회 설계했습니다.

### 2. 예약 데이터 임의 주입 스팸 차단 (RLS INSERT 제한)
* **적용 파일**: `sql_01_secure_reservations_rls.sql`
* **설명**: 비인가 사용자가 Supabase JS 클라이언트를 조작해 임의 예약을 무차별 등록하는 스팸 공격을 방지합니다.
* **조치**: 테이블 직접 INSERT 권한을 삭제하고, 신규 예약은 오직 어드민 또는 백엔드 API 서버를 통해서만 검증을 통과해야 생성될 수 있게 제한했습니다.

### 3. 백엔드 어드민 API 보호 (JWT 인증 및 관리자 검증)
* **적용 파일**: `/app/api/admin/reservations/route.ts` 및 `/[id]/route.ts`
* **설명**: 세션 토큰 없이 호출이 가능했던 대시보드 연동 API를 보안 패치했습니다.
* **조치**: 호출 시 헤더에서 JWT 토큰을 판별하여 실제 데이터베이스 상의 `role`이 `ADMIN`인 요청만 처리하도록 통제했습니다.

### 4. 권한 탈취 및 해킹 방지 (Privilege Escalation Trigger)
* **적용 파일**: `sql_02_prevent_role_hijacking.sql`
* **설명**: 일반 회원이 `users` 테이블의 본인 정보 수정 정책(RLS)을 악용하여 강제로 자신의 역할을 `ADMIN`으로 격상시키는 변조 행위를 무력화합니다.
* **조치**: DB 엔진 내 트리거 함수를 통해 클라이언트 레벨의 REST API를 통한 `role` 컬럼 변경 시, 요청자가 이미 ADMIN 권한인 상태가 아니라면 모든 처리를 에러화하고 롤백합니다.

---
*Note: Always copy and execute these scripts using the Supabase SQL Editor dashboard.*
