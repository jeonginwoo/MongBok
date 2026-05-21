import React from "react";
import { Box, Typography, Divider, Button } from "@mui/material";
import {
  Settings as SettingsIcon,
  Search as SearchIcon,
  AddToPhotos as AddToPhotosIcon,
  DeleteForever as DeleteForeverIcon,
  AspectRatio as AspectRatioIcon,
  ViewQuilt as ViewQuiltIcon,
  DragIndicator as DragIndicatorIcon,
  FormatIndentIncrease as FormatIndentIncreaseIcon,
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon,
  Info as InfoIcon,
  ImportExport as ImportExportIcon,
  FiberManualRecord as FiberManualRecordIcon,
  Download as DownloadIcon,
  Window as WindowsIcon,
  Apple as AppleIcon,
} from "@mui/icons-material";
import { PLATFORM_COLORS } from "@/data/color";

const Section = ({ title, children }) => (
  <Box sx={{ mb: 4 }}>
    <Typography
      variant="h5"
      component="h2"
      sx={{ fontWeight: 700, fontSize: "1.6rem", mb: 1.5 }}
    >
      {title}
    </Typography>
    <Divider sx={{ mb: 2, borderColor: "primary.main", opacity: 0.4 }} />
    {children}
  </Box>
);

const Item = ({ icon, primary, secondary }) => (
  <Box sx={{ display: "flex", gap: 2, mb: 2.5, alignItems: "flex-start" }}>
    <Box
      sx={{
        color: "primary.main",
        mt: "0.2rem",
        flexShrink: 0,
        display: "flex",
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography sx={{ fontWeight: 600, fontSize: "1.35rem", mb: 0.4 }}>
        {primary}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: "1.4rem", listStyleType: "disc" }}>
        {(Array.isArray(secondary) ? secondary : [secondary]).map((line, i) => (
          <Box
            component="li"
            key={i}
            sx={{ fontSize: "1.2rem", color: "text.secondary", lineHeight: 1.65 }}
          >
            {line}
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);

export default function ManualArea() {
  return (
    <Box
      sx={{
        flex: "1 1 auto",
        overflowY: "scroll",
        backgroundColor: "background.default",
        color: "text.primary",
        p: { xs: 2, sm: 3, md: 5 },
      }}
    >
      <Box sx={{ maxWidth: 680, mx: "auto", pb: 8 }}>

        <Typography
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "2.4rem", sm: "3rem" },
            letterSpacing: "-0.03em",
            mb: 0.5,
            background: (theme) => theme.palette.primary.gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          몽복 가이드
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "1.3rem", mb: 5 }}>
          멀티 스트리밍 뷰어 사용 설명서
        </Typography>

        {/* 채널 관리 */}
        <Section title="채널 관리">
          <Item
            icon={<SearchIcon />}
            primary="채널 검색"
            secondary={[
              "우측 컨트롤러 상단의 검색창에서 원하는 채널을 검색할 수 있습니다.",
              "검색어 입력 후 Enter를 누르거나 0.5초 동안 입력이 없으면 자동으로 검색됩니다.",
              "검색 결과는 각 플랫폼에서 상위 5개가 출력됩니다.",
            ]}
          />
          <Item
            icon={<AddToPhotosIcon />}
            primary="채널 추가"
            secondary="검색 결과 목록에서 원하는 채널을 클릭하면 채널 목록에 추가됩니다."
          />
          <Item
            icon={<DeleteForeverIcon />}
            primary="채널 삭제"
            secondary={[
              "채널 목록에서 각 채널에 마우스를 올리면 나타나는 휴지통 아이콘을 클릭하여 삭제할 수 있습니다.",
              "모바일에서는 해당 위치를 터치하면 됩니다.",
            ]}
          />
          <Item
            icon={<DragIndicatorIcon />}
            primary="채널 배치 및 정렬"
            secondary={[
              "목록의 채널을 클릭하면 화면에 배치됩니다.",
              "배치된 채널은 드래그하여 순서를 변경할 수 있고, 다시 클릭하면 목록으로 돌아갑니다.",
              "목록에 대기 중인 채널은 시청자순(1순위), 채널명순(2순위)으로 자동 정렬됩니다.",
            ]}
          />
          <Item
            icon={<ImportExportIcon />}
            primary="채널 수동 추가"
            secondary={[
              "검색 상위 5개에 없는 채널은 설정 > 설정 동기화에서 직접 추가할 수 있습니다.",
              '채널 목록에 추가할 항목을 channels 항목에 "채널ID": { "platform": "플랫폼명" } 형식으로 입력 후 저장하면 됩니다.',
              "채널ID는 각 채널의 URL에서 확인할 수 있습니다.",
              "유튜브의 경우 채널ID 또는 채널 핸들(ex. \"@골뱅이까지작성\") 모두 적용 가능하고, 핸들을 사용할 경우 자동으로 채널ID로 변환됩니다.",
              "플랫폼명은 chzzk / soop / youtube 중 하나입니다.",
            ]}
          />
        </Section>

        {/* 화면 레이아웃 */}
        <Section title="화면 레이아웃">
          <Item
            icon={<AspectRatioIcon />}
            primary="화면 비율 선택 (↑ / ↓)"
            secondary={[
              "컨트롤러의 비율 버튼으로 전체 화면 비율(예: 16:9, 9:16)을 선택합니다.",
              "모바일에서는 기기 방향에 따라 자동 전환됩니다.",
            ]}
          />
          <Item
            icon={<ViewQuiltIcon />}
            primary="레이아웃 유형 선택 (1, 2, 3…)"
            secondary="배치된 방송 개수에 따라 선택 가능한 레이아웃이 버튼으로 표시됩니다."
          />
          <Item
            icon={<DragIndicatorIcon />}
            primary="방송 · 채팅창 위치 변경"
            secondary={[
              "채널을 드래그하여 빈 공간(Drop Zone)으로 옮기면 배치됩니다.",
              "이미 방송이 있는 공간으로 드래그하면 두 방송의 위치가 교체됩니다.",
              "채팅창도 동일하게 위치를 변경할 수 있습니다.",
            ]}
          />
        </Section>

        {/* 컨트롤러 */}
        <Section title="컨트롤러">
          <Item
            icon={<FormatIndentIncreaseIcon />}
            primary="사이드바 펴기/접기 (C)"
            secondary="컨트롤러 영역을 펴거나 접어 방송 화면을 넓게 볼 수 있습니다."
          />
          <Item
            icon={<SettingsIcon />}
            primary="설정 (S)"
            secondary="테마, 화면, 녹화, 동기화 설정을 변경할 수 있습니다."
          />
          <Item
            icon={<RefreshIcon />}
            primary="채널 정보 새로고침 (R)"
            secondary={[
              "모든 채널의 라이브 상태와 시청자 수를 즉시 갱신합니다.",
              "배치된 채널은 60초, 목록의 채널은 10분마다 자동 갱신됩니다.",
            ]}
          />
          <Item
            icon={<FiberManualRecordIcon />}
            primary="방송 화면 녹화"
            secondary={[
              "녹화 시작 시 브라우저 팝업에서 '이 탭'을 선택하면 방송 화면만 녹화됩니다.",
              "설정에서 '자동 녹화 (1번 Zone)'를 켜면 1번 구역 방송 상태에 따라 자동으로 녹화가 시작/종료됩니다.",
              "녹화 파일은 인덱스 처리가 되어 있지 않아, 긴 영상의 경우 탐색(시간 이동)이 원활하지 않을 수 있습니다. 쾌적한 시청을 위해 별도의 인코딩 작업을 권장합니다.",
            ]}
          />
          <Item
            icon={<FullscreenIcon />}
            primary="전체 화면 (F)"
            secondary="방송 화면을 전체 화면으로 전환합니다."
          />
        </Section>

        {/* 참고사항 */}
        <Section title="참고사항">
          <Item
            icon={
              <Box sx={{ width: 20, height: 20, borderRadius: "50%", background: PLATFORM_COLORS.soop.profile, mt: "0.1rem" }} />
            }
            primary="숲 (SOOP)"
            secondary="같은 방송을 동시에 두 곳에 띄울 수 없습니다. 방송 종료 시간은 API에서 제공하지 않아 '?'로 표시됩니다."
          />
          <Item
            icon={
              <Box sx={{ width: 20, height: 20, borderRadius: "50%", background: PLATFORM_COLORS.chzzk.profile, mt: "0.1rem" }} />
            }
            primary="치지직 (CHZZK)"
            secondary={[
              "라이브 플레이어만 단독으로 가져올 수 없어 페이지 전체를 불러옵니다.",
              "화면을 꽉 채우려면 '화면 조작 모드(V)'로 전환 후 플레이어의 '넓은 화면 보기'와 '채팅창 닫기'를 직접 클릭해야 합니다.",
            ]}
          />
          <Item
            icon={
              <Box sx={{ width: 20, height: 20, borderRadius: "50%", background: PLATFORM_COLORS.youtube.profile, mt: "0.1rem" }} />
            }
            primary="유튜브 (YouTube)"
            secondary={[
              "동시 라이브가 여러 개인 경우 시청자 수가 가장 많은 방송이 표시됩니다.",
              "라이브 VOD가 없거나 삭제된 경우 '최신 라이브 정보 없음'으로 표시됩니다.",
              "스트리밍 시간, 마지막 방송 시간, 채팅 데이터를 가져오려면 YouTube 채팅 서버를 실행해야 합니다. 아래 다운로드 버튼으로 받은 파일로 서버를 실행할 수 있습니다.",
            ]}
          />
          <Item
            icon={<InfoIcon />}
            primary="채팅 작성 불가"
            secondary="채팅 참여는 각 플랫폼 사이트에서 직접 해야 합니다."
          />
          <Item
            icon={<InfoIcon />}
            primary="광고 및 성인 콘텐츠"
            secondary="보안 정책상 로그인이 차단되어, 구독 중이라도 광고가 나올 수 있고 19세 이상 콘텐츠는 시청할 수 없습니다."
          />
          <Item
            icon={<InfoIcon />}
            primary="모바일 환경"
            secondary="PC 사용을 권장합니다. 모바일에서는 '데스크탑 사이트 보기'를 켜고 사용하세요."
          />
          <Item
            icon={<InfoIcon />}
            primary="메모리 사용량"
            secondary="4~5개 채널 동시 시청 시 약 2~3GB의 메모리가 사용될 수 있습니다."
          />
        </Section>

        {/* YouTube 채팅 서버 */}
        <Section title="YouTube 채팅 서버">
          <Typography sx={{ fontSize: "1.25rem", color: "text.secondary", lineHeight: 1.65, mb: 2.5 }}>
            유튜브 채팅을 표시하려면 로컬에서 채팅 서버를 실행해야 합니다. 아래 버튼으로 운영체제에 맞는 서버 실행 파일을 다운로드할 수 있습니다.
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
            {[
              { icon: <WindowsIcon />, label: "Windows", href: "/downloads/mongbok_youtube_chat_server_win-x64_v1.0.6.zip" },
              { icon: <AppleIcon />, label: "macOS", href: "/downloads/mongbok_youtube_chat_server_macos-x64_v1.0.6.zip" },
            ].map(({ icon, label, href }) => (
              <Button
                key={label}
                variant="outlined"
                href={href}
                download
                startIcon={icon}
                endIcon={<DownloadIcon />}
                sx={{ fontSize: "1.2rem", textTransform: "none", borderRadius: "0.8rem" }}
              >
                {label}
              </Button>
            ))}
          </Box>
          <Typography sx={{ fontSize: "1.15rem", color: "text.secondary", lineHeight: 1.65 }}>
            Windows는 Defender·백신 경고 시 예외 추가 후 실행하세요.
            macOS·Linux는 첫 실행 전{" "}
            <Box component="code" sx={{ fontSize: "1.1rem", fontFamily: "monospace", px: "0.4rem", py: "0.05rem", borderRadius: "0.3rem", backgroundColor: "action.hover" }}>
              chmod +x ./파일명
            </Box>
            {" "}으로 실행 권한을 부여해야 합니다.
          </Typography>
        </Section>

        <Typography
          sx={{
            textAlign: "center",
            color: "text.disabled",
            fontSize: "1.1rem",
            mt: 6,
          }}
        >
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </Typography>
      </Box>
    </Box>
  );
}