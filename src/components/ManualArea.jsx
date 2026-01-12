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
import SearchIcon from "@mui/icons-material/Search";
import AddToPhotosIcon from "@mui/icons-material/AddToPhotos";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AspectRatioIcon from "@mui/icons-material/AspectRatio";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import MouseIcon from "@mui/icons-material/Mouse";
import FormatIndentIncreaseIcon from "@mui/icons-material/FormatIndentIncrease";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RefreshIcon from "@mui/icons-material/Refresh";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import InfoIcon from "@mui/icons-material/Info";
import ImportExportIcon from "@mui/icons-material/ImportExport";
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
        color: (theme) => theme.palette.primary.main,
        fontSize: "2.4rem",
      }}
    >
      {title}
    </Typography>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Paper>
);

const ManualListItem = ({ icon, primary, secondary }) => (
  <ListItem sx={{ py: 1.5, alignItems: "flex-start" }}>
    <ListItemIcon
      sx={{
        minWidth: "6.0rem",
        color: (theme) => theme.palette.common.pointColors.pointColor6,
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
            background: (theme) =>
              `linear-gradient(45deg, ${theme.palette.common.pointColors.pointColor5} 30%, ${theme.palette.common.pointColors.pointColor7} 90%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0.1rem 0.1rem 0.3rem rgba(0,0,0,0.1)",
          }}
        >
          스트림퓨전 사용 설명서
        </Typography>

        <Section title="1. 주요 기능">
          <Typography sx={{ lineHeight: 1.6, fontSize: "1.3rem" }}>
            스트림퓨전(StreamFusion)은 여러 스트리밍 플랫폼의 방송을 한 화면에서 동시에
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
              secondary="우측 컨트롤러 상단의 검색창에서 원하는 채널을 검색할 수 있습니다. 검색어 입력 후 Enter를 누르거나, 0.5초 동안 입력이 없으면 자동으로 검색됩니다. 검색 결과는 각 플랫폼 에서 최대 5개가 출력됩니다."
            />
            <ManualListItem
              icon={<AddToPhotosIcon sx={{ fontSize: '2rem' }} />}
              primary="채널 추가"
              secondary="검색 결과 목록에서 원하는 채널을 클릭하면 채널 목록에 추가됩니다. 추가된 채널은 컨트롤러의 채널 목록에서 확인할 수 있습니다."
            />
            <ManualListItem
              icon={<DeleteForeverIcon sx={{ fontSize: '2rem' }} />}
              primary="채널 삭제"
              secondary="채널 목록에서 각 채널 우측의 휴지통 아이콘을 클릭하여 목록에서 삭제할 수 있습니다."
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
              secondary="컨트롤러 영역을 펴거나 접습니다."
            />
            <ManualListItem
              icon={<Brightness4Icon sx={{ fontSize: '2rem' }} />}
              primary="테마 전환 (단축키: M)"
              secondary="클릭할 때마다 라이트 모드와 다크 모드를 전환합니다."
            />
            <ManualListItem
              icon={<AccessTimeIcon sx={{ fontSize: '2rem' }} />}
              primary="현재 시간 표시 (단축키: T)"
              secondary="화면 좌측 상단에 표시되는 현재 시간의 ON/OFF 상태를 토글합니다. 현재 시간은 전체 화면 버튼과 동일한 기능을 합니다."
            />
            <ManualListItem
              icon={<MouseIcon sx={{ fontSize: '2rem' }} />}
              primary="화면 모드 변경 (단축키: V)"
              secondary="'화면 이동 모드'와 '화면 조작 모드'를 전환합니다. 조작 모드에서는 드래그 앤 드롭이 비활성화되는 대신, 각 방송 화면을 직접 클릭하여 제어할 수 있습니다."
            />
            <ManualListItem
              icon={<RefreshIcon sx={{ fontSize: '2rem' }} />}
              primary="채널 정보 새로고침 (단축키: R)"
              secondary="모든 채널의 라이브 상태, 시청자 수 등의 정보를 새로고침합니다. (60초마다 자동 새로고침되며, 채널이 off 상태에서 live 상태로 변화 감지 시 플레이어를 새로고침 합니다.)"
            />
            <ManualListItem
              icon={<ImportExportIcon sx={{ fontSize: '2rem' }} />}
              primary="데이터 동기화"
              secondary="다른 브라우저나 기기에서 현재 채널 목록과 설정을 그대로 사용하고 싶을 때 사용합니다. 'Copy' 버튼으로 현재 데이터를 복사한 후, 다른 환경의 입력란에 붙여넣고 'Save' 버튼을 누르면 데이터가 동기화됩니다."
            />
            <ManualListItem
              icon={<FullscreenIcon sx={{ fontSize: '2rem' }} />}
              primary="전체 화면 (단축키: F)"
              secondary="전체 화면 모드를 켜거나 끕니다."
            />
          </List>
        </Section>

        <Section title="5. 주의사항">
          <List>
            <ManualListItem
              icon={<InfoIcon sx={{ fontSize: "2rem" }} />}
              primary="숲(SOOP) 플랫폼"
              secondary="숲 플랫폼은 같은 방송을 동시에 띄울 수 없습니다. 또한, 방송 종료 시간을 API로 제공하지 않아 '?'로 표시됩니다."
            />
            <ManualListItem
              icon={<InfoIcon sx={{ fontSize: "2rem" }} />}
              primary="치지직(CHZZK) 플랫폼"
              secondary="치지직은 별도의 라이브 플레이어만 가져올 수 없어 페이지 전체를 불러옵니다. 이로 인해 화면을 꽉 채워서 보려면, '화면 조작 모드(V)'로 변경 후 플레이어의 '넓은 화면 보기'와 '채팅창 닫기'를 직접 클릭해야 합니다."
            />
            <ManualListItem
              icon={<InfoIcon sx={{ fontSize: "2rem" }} />}
              primary="채팅"
              secondary="본 서비스에는 채팅 작성 기능이 없으므로, 채팅 참여를 위해서는 각 플랫폼 사이트를 이용해야 합니다."
            />
            <ManualListItem
              icon={<InfoIcon sx={{ fontSize: "2rem" }} />}
              primary="광고 및 19세 이상 콘텐츠"
              secondary="보안 정책상 로그인 기능이 차단되어 있어, 구독 중이라도 광고가 나올 수 있으며 19세 이상 콘텐츠는 시청할 수 없습니다."
            />
            <ManualListItem
              icon={<InfoIcon sx={{ fontSize: "2rem" }} />}
              primary="메모리 사용량"
              secondary="4개 채널을 동시에 시청할 경우, 약 1.3GB의 메모리가 사용될 수 있습니다."
            />
          </List>
        </Section>
      </Box>
    </Box>
  );
}