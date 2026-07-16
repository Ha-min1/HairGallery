# 📨 예약 확정 및 접수 알림 (EmailJS & 카카오 알림톡) 연동 가이드

예약 접수 및 확정 단계에 따른 **이중 제어 알림 시스템** 구축이 완료되었습니다.
1. **예약 신청 접수 시**: 지정된 어드민(관리자)에게 이메일 알림 자동 발송.
2. **예약 확정/취소 처리 시**: 어드민 대시보드에서 체크박스 선택 여부에 따라 고객에게 확정/취소 메일 및 카카오톡 전송.

---

## 🛠️ 새롭게 변경 및 추가된 구조

### 1. [어드민 전용] 신규 예약 접수 알림 템플릿 설정 (EmailJS)
고객이 예약을 신청하면, 알림 수신 대상자로 활성화된 관리자의 이메일 주소로 알림 메일이 갑니다.

1. EmailJS 콘솔에서 **어드민용 새 템플릿**을 하나 더 생성합니다.
2. **Settings** 탭의 **To Email** 란에 정확히 **`{{to_email}}`**을 기입합니다.
3. 템플릿 본문(Content)에 아래 코드 매칭 변수들을 기입합니다:
   * **`{{customer_name}}`**: 예약 신청한 고객 이름
   * **`{{customer_phone}}`**: 고객 휴대폰 번호
   * **`{{booking_date}}`**: 예약 날짜
   * **`{{booking_time}}`**: 예약 시간
   * **`{{service_name}}`**: 신청 시술 명
   * **`{{price}}`**: 결제 금액
4. 생성된 어드민용 템플릿 ID를 환경변수에 추가합니다.

### 2. [어드민 대시보드] 알림 수신 관리자 지정 기능
어드민 대시보드에 **[알림 수신 설정]** 탭이 추가되었습니다.
* 해당 탭에 진입하면 모든 관리자(ADMIN)들의 목록이 표시됩니다.
* 관리자 이름 옆의 **토글 스위치**를 통해 특정 관리자에게 새로운 예약 접수 메일이 발송되도록 켜고 끌 수 있습니다.
* **⚠️ 선행 작업**: 데이터베이스의 `users` 테이블에 수신 플래그 컬럼을 추가하는 **SQL 쿼리 실행이 필요**합니다. (하단 SQL 가이드 참고)

### 3. [어드민 대시보드] 고객 알림 전송 체크박스
* 어드민 대시보드의 예약 명단 헤더에 **[확정/취소 시 고객 알림 전송]** 체크박스가 추가되었습니다.
* 이 체크박스를 체크한 상태에서 예약을 확정(`Confirmed`)하거나 취소(`Cancelled`) 처리하면 고객에게 이메일과 알림톡이 자동 발송됩니다.
* 체크를 해제하고 처리하면 고객에게 알림이 가지 않고 조용히 상태만 변경됩니다.

---

## 🔑 환경 변수 최종 정리

`.env.local` 및 Cloudflare Pages 대시보드의 Environment Variables 설정에 아래 값들을 등록해 주세요.

```env
# EmailJS 공통 인증 정보
EMAILJS_SERVICE_ID=service_xxxxx
EMAILJS_PUBLIC_KEY=user_xxxxxxxxxxxx
EMAILJS_PRIVATE_KEY=your_private_key_here

# 템플릿 ID 리스트
EMAILJS_TEMPLATE_ID=template_client_xxxxx       # 고객용 예약 확정 메일 템플릿
EMAILJS_ADMIN_TEMPLATE_ID=template_admin_xxxxx   # 관리자용 예약 접수 알림 메일 템플릿

# Solapi 카카오 알림톡 인증 정보
SOLAPI_API_KEY=YOUR_SOLAPI_API_KEY
SOLAPI_API_SECRET=YOUR_SOLAPI_API_SECRET
SOLAPI_FROM_PHONE=01012345678  # 인증한 발신자 번호 (숫자만)
SOLAPI_PF_ID=KA01PFxxxxxxxxxx # 카카오 채널 ID
SOLAPI_TEMPLATE_ID=KA01TPxxxxxx # 카카오 알림톡 템플릿 ID
```

---

## 🗄️ 3. 데이터베이스(Supabase) SQL 반영 가이드

관리자 수신 설정 기능을 지원하기 위해 Supabase 콘솔의 **SQL Editor**에 다음 쿼리를 입력하고 실행(Run)해 주셔야 합니다.

👉 **SQL 파일 열기 링크**: [sql_03_admin_notifications.sql](file:///workspaces/HairGallery/sql/sql_03_admin_notifications.sql)

```sql
-- users 테이블에 receive_notifications 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS receive_notifications BOOLEAN DEFAULT FALSE;

-- 기존 어드민 사용자들은 알림 수신이 기본 활성화되도록 기본값 세팅
UPDATE users 
SET receive_notifications = TRUE 
WHERE role = 'ADMIN';
```

---

## 🛠️ 개발 완료 및 진행 현황 체크리스트

- [x] **관리자 예약 마감 다중 선택 및 저장 기능** (완료)
- [x] **고객 예약 신청 시, 지정된 관리자에게 이메일 알림 발송 로직** (`bookings/route.ts` 완료)
- [x] **관리자별 알림 수신 토글 기능 및 UI** (`dashboard/page.tsx` 및 `admin/users` API 완료)
- [x] **상태 업데이트 시 고객 알림 온/오프 제어 체크박스 및 API 연동** (완료)
- [ ] **Supabase SQL Editor에 마이그레이션 SQL 실행** (사용자 작업 필요)
- [ ] **EmailJS 가입 및 어드민/고객용 템플릿 설정** (사용자 작업 필요)
- [ ] **환경변수 최종 설정 후 깃 푸시 및 배포 확인** (사용자 작업 필요)
