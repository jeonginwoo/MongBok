import React from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { lighten } from "@mui/material/styles";
import {
  Settings as SettingsIcon,
  Search as SearchIcon,
  AddToPhotos as AddToPhotosIcon,
  DeleteForever as DeleteForeverIcon,
  AspectRatio as AspectRatioIcon,
  ViewQuilt as ViewQuiltIcon,
  DragIndicator as DragIndicatorIcon,
  Mouse as MouseIcon,
  FormatIndentIncrease as FormatIndentIncreaseIcon,
  Brightness4 as Brightness4Icon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon,
  Info as InfoIcon,
  ImportExport as ImportExportIcon,
  FormatSize as FormatSizeIcon,
  FiberManualRecord as FiberManualRecordIcon,
} from "@mui/icons-material";
import { PLATFORM_COLORS } from "@/data/color";

const Section = ({ title, children }) => (
  <Paper
    elevation={3}
    sx={{
      p: 3,
      mb: 4,
      backgroundColor: "background.level1",
      borderRadius: "1.2rem",
      borderLeft: "0.5rem solid",
      borderColor: (theme) => theme.palette.primary.main,
    }}
  >
    <Typography
      variant="h4"
      component="h2"
      gutterBottom
      sx={{
        fontWeight: "bold",
        fontSize: "2.4rem",
      }}
    >
      {title}
    </Typography>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Paper>
);

const ManualListItem = ({ icon, primary, secondary, nested }) => (
  <ListItem sx={{ py: 1.5, alignItems: "flex-start", pl: nested ? 10 : 2 }}>
    <ListItemIcon
      sx={{
        minWidth: "6.0rem",
        color: (theme) => theme.palette.primary.brand,
        mt: 1,
      }}
    >
      {icon}
    </ListItemIcon>
    <ListItemText
      primary={primary}
      secondary={secondary}
      primaryTypographyProps={{
        fontWeight: "bold",
        fontSize: "1.45rem",
        marginBottom: "0.4rem",
      }}
      secondaryTypographyProps={{
        lineHeight: 1.5,
        fontSize: "1.2rem",
        color: "text.secondary",
      }}
    />
  </ListItem>
);

export default function ManualArea() {
  return (
    <Box
      sx={{
        flex: "1 1 auto",
        display: "flex",
        justifyContent: "center",
        backgroundColor: "background.default",
        color: "text.primary",
        overflowY: "scroll",
        p: { xs: 1, sm: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          maxWidth: 800,
          width: "100%",
          pb: { xs: 8, sm: 8, md: 8 },
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          textAlign="center"
          gutterBottom
          sx={{
            fontWeight: "bold",
            my: 4,
            fontSize: { xs: "2.5rem", sm: "3rem", md: "3.5rem" },
            background: (theme) => theme.palette.primary.gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0.1rem 0.1rem 0.3rem rgba(0,0,0,0.1)",
          }}
        >
          스퓨즈 사용 설명서
        </Typography>

        <Section title="1. 주요 기능">
          <Typography sx={{ lineHeight: 1.6, fontSize: "1.3rem" }}>
            스퓨즈(S-Fuz)는 여러 스트리밍 플랫폼의 방송을 한 화면에서 동시에
            시청할 수 있는 서비스입니다. 현재{" "}
            <strong style={{ color: PLATFORM_COLORS.chzzk.main }}>치지직</strong>과{" "}
            <strong style={{ color: PLATFORM_COLORS.soop.main }}>숲</strong>{" "}
            플랫폼을 지원하며, 다음과 같은 주요 기능을 제공합니다.
          </Typography>
          <List>
            <ListItem sx={{ py: 0.5, fontSize: "1.25rem" }}>
              - 여러 방송을 원하는 레이아웃으로 자유롭게 배치하여 시청
            </ListItem>
            <ListItem sx={{ py: 0.5, fontSize: "1.25rem" }}>
              - 각 방송의 실시간 채팅을 한 화면에서 확인
            </ListItem>
            <ListItem sx={{ py: 0.5, fontSize: "1.25rem" }}>
              - 사용자 편의를 위한 다양한 화면 제어 기능
            </ListItem>
          </List>
        </Section>

        <Section title="2. 채널 관리">
          <List>
            <ManualListItem
              icon={<SearchIcon sx={{ fontSize: '2rem' }} />}
              primary="채널 검색"
              secondary="우측 컨트롤러 상단의 검색창에서 원하는 채널을 검색할 수 있습니다. 검색어 입력 후 Enter를 누르거나, 0.5초 동안 입력이 없으면 자동으로 검색됩니다. 검색 결과는 각 플랫폼에서 상위 5개가 출력됩니다."
            />
            <ManualListItem
              icon={<AddToPhotosIcon sx={{ fontSize: '2rem' }} />}
              primary="채널 추가"
              secondary="검색 결과 목록에서 원하는 채널을 클릭하면 채널 목록에 추가됩니다. 추가된 채널은 컨트롤러의 채널 목록에서 확인할 수 있습니다."
            />
            <ManualListItem
              icon={<DeleteForeverIcon sx={{ fontSize: '2rem' }} />}
              primary="채널 삭제"
              secondary="채널 목록에서 각 채널에 마우스를 올렸을 때 나타나는 우측의 휴지통 아이콘을 클릭하여 목록에서 삭제할 수 있습니다. 모바일에서는 휴지통이 안보이지만 해당 위치 클릭하면 삭제할 수 있습니다."
            />
            <ManualListItem
              icon={<DragIndicatorIcon sx={{ fontSize: '2rem' }} />}
              primary="채널 활성화 및 정렬"
              secondary="목록의 채널을 클릭하면 상단으로 이동(활성화)되어 화면에 표시됩니다. 활성화된 채널은 드래그하여 순서를 변경할 수 있으며, 다시 클릭하면 목록으로 돌아갑니다. 비활성화된 채널은 1순위-시청자순, 2순위-채널명 으로 자동 정렬됩니다."
            />
          </List>
        </Section>

        <Section title="3. 화면 레이아웃 설정">
          <List>
            <ManualListItem
              icon={<AspectRatioIcon sx={{ fontSize: '2rem' }} />}
              primary="전체 화면 비율 선택"
              secondary="컨트롤러의 비율 버튼을 클릭하여 원하는 전체 화면 비율(예: 16:9, 9:16)을 선택할 수 있습니다. 모바일 기기에서는 기기 방향에 따라 가로/세로 모드가 자동으로 전환됩니다."
            />
            <ManualListItem
              icon={<ViewQuiltIcon sx={{ fontSize: '2rem' }} />}
              primary="레이아웃 유형 선택 (단축키: 1, 2, 3...)"
              secondary="화면에 표시 중인 방송 개수에 따라 선택 가능한 레이아웃 유형이 버튼으로 표시됩니다. 원하는 레이아웃을 선택하여 방송 화면 배치를 변경할 수 있습니다."
            />
            <ManualListItem
              icon={<DragIndicatorIcon sx={{ fontSize: '2rem' }} />}
              primary="방송 및 채팅창 위치 변경 (드래그 앤 드롭)"
              secondary="채널 목록에서 원하는 채널을 드래그하여 화면의 빈 공간(Drop Zone)으로 옮기면 해당 위치에 방송이 표시됩니다. 이미 방송이 있는 공간으로 드래그하면 두 방송의 위치가 서로 교체됩니다. 채팅창 또한 동일한 방식으로 위치를 변경할 수 있습니다."
            />
          </List>
        </Section>

        <Section title="4. 컨트롤러 기능">
          <List>
            <ManualListItem
              icon={<FormatIndentIncreaseIcon sx={{ fontSize: '2rem' }} />}
              primary="사이드바 펴기/접기 (단축키: S)"
              secondary="컨트롤러(사이드바) 영역을 펴거나 접습니다. 넓은 화면으로 시청하고 싶을 때 유용합니다."
            />
            <ManualListItem
              icon={<SettingsIcon sx={{ fontSize: '2rem' }} />}
              primary="설정"
              secondary="테마 색상, 포인트 컬러, 현재 시간 표시 여부, 화면 조작 모드 설정, 설정 동기화 기능이 포함된 설정 팝업을 엽니다."
            />
            <ManualListItem
              icon={<Brightness4Icon sx={{ fontSize: '2rem' }} />}
              nested
              primary="테마/포인트 컬러 변경"
              secondary="라이트/다크 모드 전환 및 앱의 포인트 컬러를 변경하여 원하는 디자인으로 꾸밀 수 있습니다."
            />
            <ManualListItem
              icon={<MouseIcon sx={{ fontSize: '2rem' }} />}
              nested
              primary="화면 조작/이동 모드 (단축키: V)"
              secondary="'화면 이동 모드'와 '화면 조작 모드'를 전환합니다. 이동 모드에서는 드래그&드롭으로 화면 배치를 변경할 수 있고, 조작 모드에서는 각 방송 화면(치지직 채팅창 닫기 등)을 직접 클릭하여 제어할 수 있습니다. 조작 모드에서는 채팅창을 마우스 휠로 스크롤하여 이전 채팅을 확인할 수 있으며, 스크롤을 올린 상태에서 새 채팅이 오면 최신 채팅으로 이동하는 버튼이 나타납니다."
            />
            <ManualListItem
              icon={<AccessTimeIcon sx={{ fontSize: '2rem' }} />}
              nested
              primary="현재 시간 (단축키: T)"
              secondary="설정에서 시간 표시를 켠 경우, 화면 좌측 상단에 현재 시간이 표시됩니다. 시간을 클릭하면 전체 화면 모드가 토글됩니다."
            />
            <ManualListItem
              icon={<FormatSizeIcon sx={{ fontSize: "2rem" }} />}
              nested
              primary="채팅창 글자 크기 조절 (단축키: ↑, ↓)"
              secondary="설정 팝업을 열지 않고도, 방향키 위(↑)/아래(↓) 버튼을 눌러 채팅창의 글자 크기를 간편하게 조절할 수 있습니다."
            />
            <ManualListItem
              icon={<ImportExportIcon sx={{ fontSize: '2rem' }} />}
              nested
              primary="설정 동기화"
              secondary="현재 브라우저에 저장된 설정(채널 목록, 레이아웃 등)을 텍스트 형태로 복사하거나, 다른 기기에서 복사한 설정을 붙여넣어 동기화할 수 있습니다."
            />
            <ManualListItem
              icon={<RefreshIcon sx={{ fontSize: '2rem' }} />}
              primary="채널 정보 새로고침 (단축키: R)"
              secondary="모든 채널의 라이브 상태, 시청자 수 등의 정보를 즉시 새로고침합니다. (60초마다 자동 갱신되며, 방송 시작 감지 시 자동으로 플레이어를 불러옵니다.)"
            />
            <ManualListItem
              icon={<FiberManualRecordIcon sx={{ fontSize: '2rem' }} />}
              primary="방송 화면 녹화"
              secondary="컨트롤러의 녹화 버튼(●)을 클릭하여 현재 시청 중인 방송 화면(Canvas 영역)을 녹화할 수 있습니다. 녹화 시작 시 브라우저 팝업에서 '이 탭 (Current Tab)'을 선택해야 사이드바 등을 제외한 순수 방송 화면만 깔끔하게 녹화됩니다. 설정 메뉴에서 '자동 녹화 (1번 Zone)' 기능을 켜면, 가장 큰 화면(1번 구역)의 방송 상태에 따라 자동으로 녹화가 시작/종료됩니다."
            />
            <ManualListItem
              icon={<FullscreenIcon sx={{ fontSize: '2rem' }} />}
              primary="전체 화면 (단축키: F)"
              secondary="브라우저 전체 화면 모드를 켜거나 끕니다."
            />
          </List>
        </Section>

        <Section title="5. 주의사항">
          <List>
            <ManualListItem
              icon={<InfoIcon sx={{ fontSize: "2rem" }} />}
              primary="숲(SOOP) 플랫폼"
              secondary="숲 플랫폼은 같은 방송을 동시에 띄울 수 없습니다. 방송 종료 시간을 API로 제공하지 않아 '?'로 표시됩니다."
            />
            <ManualListItem
              icon={<InfoIcon sx={{ fontSize: "2rem" }} />}
              primary="치지직(CHZZK) 플랫폼"
              secondary="치지직은 별도의 라이브 플레이어만 가져올 수 없어 페이지 전체를 불러옵니다. 이로 인해 화면을 꽉 채워서 보려면, '화면 조작 모드(V)'로 변경 후 플레이어의 '넓은 화면 보기'와 '채팅창 닫기'를 직접 클릭해야 합니다."
            />
            <ManualListItem
              icon={<InfoIcon sx={{ fontSize: "2rem" }} />}
              primary="채팅 X"
              secondary="본 서비스에는 채팅 작성 기능이 없으므로, 채팅 참여를 위해서는 각 플랫폼 사이트를 이용해야 합니다."
            />
            <ManualListItem
              icon={<InfoIcon sx={{ fontSize: "2rem" }} />}
              primary="광고 및 19세 이상 콘텐츠"
              secondary="보안 정책상 로그인 기능이 차단되어 있어, 구독 중이라도 광고가 나올 수 있으며 19세 이상 콘텐츠는 시청할 수 없습니다."
            />
            <ManualListItem
              icon={<InfoIcon sx={{ fontSize: "2rem" }} />}
              primary="모바일 환경"
              secondary="본 서비스는 기본적으로 PC 사용을 권장하며, 모바일 환경에서는 브라우저의 '데스크탑 사이트 보기' 설정을 권장합니다. 기기 해상도에 따라 화면 비율이나 폰트 크기 조절이 필요할 수 있습니다."
            />
            <ManualListItem
              icon={<InfoIcon sx={{ fontSize: "2rem" }} />}
              primary="메모리 사용량"
              secondary="4~5개 채널을 동시에 시청할 경우, 약 2~3GB 가량의 메모리가 사용될 수 있습니다."
            />
          </List>
        </Section>
      </Box>
    </Box>
  );
}