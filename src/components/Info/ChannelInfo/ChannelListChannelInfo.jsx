import React, { useRef } from "react";
import dayjs from "dayjs";
import { Box, Typography, Tooltip, Skeleton } from "@mui/material";
import { PLATFORM_COLORS } from "@/data/color";

import LiveCategory from "@/components/Info/LiveCategory";
import LiveTags from "@/components/Info/LiveTags";
import LiveTime from "@/components/Info/LiveTime";
import UserCount from "@/components/Info/UserCount";
import ProfileImage from "@/components/Info/ProfileImage";
import ChannelStatus from "@/components/Info/ChannelStatus";

import { useAtomValue } from "jotai";
import { controllerExpandedAtom } from "@/atoms/setting";
import { controllerPopupOpenAtom, settingsOpenAtom } from "@/atoms/ui";

export default function ChannelInfo({ channel, isDragging = false }) {
  if (!channel) return null;

  const controllerExpanded = useAtomValue(controllerExpandedAtom);
  const controllerPopupOpen = useAtomValue(controllerPopupOpenAtom);
  const settingsOpen = useAtomValue(settingsOpenAtom);
  const anchorRef = useRef(null);

  // 리모컨 분리 + 설정창 닫힘: 상/하단 배치를 유지하되 오른쪽으로 쏠리게(top-end, 공간 부족 시 bottom-end로 flip)
  // 설정창 열림: 우측(설정창 쪽 여백) / 그 외(도킹): 좌측
  const isPopupNoSettings = controllerPopupOpen && !settingsOpen;
  const tooltipPlacement = settingsOpen
    ? "right"
    : isPopupNoSettings
    ? "top-end"
    : "left";

  if (channel._loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          userSelect: "none",
        }}
      >
        <Skeleton
          variant="circular"
          width={54}
          height={54}
          sx={{ flexShrink: 0, bgcolor: "background.level5", userSelect: "none" }}
        />
        {controllerExpanded && (
          <Box sx={{ width: "100%", marginRight: "0.5rem" }}>
            <Skeleton
              variant="text"
              width="60%"
              sx={{ fontSize: "1.4rem", bgcolor: "background.level5" }}
            />
            <Skeleton
              variant="text"
              width="40%"
              sx={{ fontSize: "1.2rem", bgcolor: "background.level5" }}
            />
          </Box>
        )}
      </Box>
    );
  }

  const inactiveStyle = !channel.isLive
    ? { filter: "grayscale(100%) brightness(0.7)" }
    : {};

  const getThumbnailUrl = () => {
    if (!channel.isLive || !channel.liveImageUrl) return null;
    const url = channel.liveImageUrl;
    const timestamp = channel.lastRefreshed || Date.now();
    return `${url}${url.includes("?") ? "&" : "?"}t=${timestamp}`;
  };

  const thumbnailUrl = getThumbnailUrl();

  const tooltipTitle = (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {thumbnailUrl && (
        <Box
          component="img"
          src={thumbnailUrl}
          sx={{
            display: "block",
            width: "100%",
            aspectRatio: "16 / 9",
            objectFit: "cover",
            backgroundColor: "background.level5",
            // 툴팁 가장자리(테두리)에 딱 붙도록 패딩 없이, 상단 모서리만 툴팁 라운드에 맞춤
            borderTopLeftRadius: "0.3rem",
            borderTopRightRadius: "0.3rem",
          }}
        />
      )}
      {/* 텍스트 영역에만 패딩 */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1 }}>
        <Box sx={{ fontSize: "1.4rem" }}>
          <Box
            component="span"
            sx={{
              color: (theme) => `${theme.palette.platform[channel.platform].main}`,
              fontWeight: "bold",
            }}
          >
            {channel.name || "채널명 없음"}
          </Box>
          {" : "}
          {channel.liveTitle || "제목 없음"}
        </Box>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 0.5,
            maxWidth: "26.0rem",
          }}
        >
          <LiveCategory channel={channel} isTag={true} />
          <LiveTags channel={channel} isTag={true} />
          {channel.isLive ? (
            <>
              <UserCount channel={channel} isTag={true} />
              <LiveTime channel={channel} isTag={true} />
            </>
          ) : (
            <ChannelStatus channel={channel} isTag={true} />
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Tooltip
      placement={tooltipPlacement}
      arrow
      disableInteractive
      title={isDragging ? null : tooltipTitle}
      slotProps={{
        popper: {
          // 앵커가 있는 창(도킹=메인, 분리=팝업)으로 portal 해야 위치가 맞고 잘리지 않음
          container: () => anchorRef.current?.ownerDocument?.body,
          modifiers: [
            { name: "preventOverflow", options: { padding: 8 } },
            { name: "flip", options: { padding: 8 } },
          ],
        },
        tooltip: {
          sx: {
            fontSize: "1.2rem",
            textAlign: "left",
            // 미리보기 이미지가 테두리에 딱 붙도록 툴팁 기본 패딩 제거 (텍스트 패딩은 내부에서 처리)
            p: 0,
            // 좁은 팝업 창에서도 창 밖으로 넘치지 않도록 제한
            maxWidth: "min(26rem, 90vw)",
            backgroundColor: "background.level1",
            color: "text.primary",
            border: "0.1rem solid",
            borderColor: "border.primary",
          },
        },
      }}
    >
      <Box
        ref={anchorRef}
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          border: "none",
          transition: "filter 0.3s ease",
          userSelect: "none",
          ...inactiveStyle,
        }}
      >
        <ProfileImage channel={channel} gapSize={1} />

        {controllerExpanded && (
          <Box sx={{ width: "100%", marginRight: "0.5rem" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignContent: "center",
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  fontSize: "1.4rem",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: channel.isLive ? "9.2rem" : "18rem",
                }}
              >
                {channel.name}
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {channel.isLive && <UserCount channel={channel} />}
                {channel.isLive && <LiveTime channel={channel} />}
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: "1.2rem",
                borderRadius: "10rem",
                color: "text.secondary",
                fontWeight: "bold",
              }}
            >
              {channel.isLive ? (
                <LiveCategory channel={channel} sx={{ maxWidth: "18rem" }} />
              ) : (                <ChannelStatus channel={channel} />
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}
