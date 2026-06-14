"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Box,
  TextField,
  Paper,
  CircularProgress,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  InputAdornment,
  Tooltip,
  Switch,
} from "@mui/material";
import Image from "next/image";

import AddIcon from "@mui/icons-material/Add";
import AppsIcon from "@mui/icons-material/Apps";
import SearchChannelInfo from "@/components/Info/ChannelInfo/SearchChannelInfo";
import { searchChannels } from "@/api/search";
import { updatePreferences } from "@/utils/preferences";

import { useAtom, useSetAtom } from "jotai";
import { channelsAtom, selectedSearchPlatformAtom, platformEnabledAtom } from "@/atoms/setting";
import { snackbarAtom } from "@/atoms/ui";

// 플랫폼 표시 순서
const ALL_PLATFORMS = ["chzzk", "soop", "youtube", "twitch"];

const platformLogos = {
  chzzk: "/chzzk/chzzk_logo.png",
  soop: "/soop/soop_logo.png",
  youtube: "/youtube/youtube_logo.png",
  twitch: "/twitch/twitch_logo.png",
};

const platformNames = {
  chzzk: "CHZZK",
  soop: "SOOP",
  youtube: "YouTube",
  twitch: "Twitch",
};

const tooltipProps = {
  slotProps: {
    tooltip: {
      sx: {
        fontSize: "1.2rem",
      },
    },
  },
  placement: "top",
};

export default function SearchChannel() {
  const maxChannels = 30;

  const [channels, setChannels] = useAtom(channelsAtom);
  const [selectedPlatform, setSelectedPlatform] = useAtom(selectedSearchPlatformAtom);
  const [platformEnabled, setPlatformEnabled] = useAtom(platformEnabledAtom);
  const setSnackbar = useSetAtom(snackbarAtom);

  // 활성화된 플랫폼만 (검색 대상 / 검색 결과 팝업에 표시)
  const enabledPlatforms = useMemo(
    () => ALL_PLATFORMS.filter((p) => platformEnabled[p]),
    [platformEnabled]
  );

  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const [results, setResults] = useState({ chzzk: [], soop: [], youtube: [], twitch: [] });
  const [loadingPlatforms, setLoadingPlatforms] = useState({ chzzk: false, soop: false, youtube: false, twitch: false });
  const [searchedPlatforms, setSearchedPlatforms] = useState({ chzzk: false, soop: false, youtube: false, twitch: false });
  const containerRef = useRef(null);
  const searchCacheRef = useRef({}); // { [keyword]: { chzzk: [], soop: [], youtube: [], twitch: [] } }

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowList(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const debounceTimeout = useRef(null);

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) {
      setResults({ chzzk: [], soop: [], youtube: [], twitch: [] });
      setLoadingPlatforms({ chzzk: false, soop: false, youtube: false, twitch: false });
      setSearchedPlatforms({ chzzk: false, soop: false, youtube: false, twitch: false });
      setShowList(false);
      return;
    }
    setLoading(true);
    try {
        const currentKeyword = keyword;
        const cache = searchCacheRef.current[currentKeyword] ?? {};

        // 캐시에 없는 플랫폼만 실제 검색
        const platformsToFetch = enabledPlatforms.filter(
          (p) => cache[p] === undefined
        );

        // 캐시된 결과를 즉시 반영
        const cachedResults = { chzzk: [], soop: [], youtube: [], twitch: [] };
        const cachedSearched = { chzzk: false, soop: false, youtube: false, twitch: false };
        enabledPlatforms.forEach((p) => {
          if (cache[p] !== undefined) {
            cachedResults[p] = cache[p];
            cachedSearched[p] = true;
          }
        });
        setResults(cachedResults);
        setSearchedPlatforms(cachedSearched);

        // 아직 캐시 안된 플랫폼 로딩 표시
        const loadingState = { chzzk: false, soop: false, youtube: false, twitch: false };
        platformsToFetch.forEach(p => { loadingState[p] = true; });
        setLoadingPlatforms(loadingState);
        setShowList(true);

        if (platformsToFetch.length === 0) {
          // 전부 캐시 히트 → 즉시 완료
          setLoading(false);
          return;
        }

        // 캐시 안된 플랫폼만 병렬 검색
        const searchPromises = platformsToFetch.map(async (platform) => {
          try {
            const result = await searchChannels(currentKeyword, platform);
            // 캐시 저장
            if (!searchCacheRef.current[currentKeyword]) {
              searchCacheRef.current[currentKeyword] = {};
            }
            searchCacheRef.current[currentKeyword][platform] = result;

            setResults((prev) => ({ ...prev, [platform]: result }));
            setLoadingPlatforms((prev) => ({ ...prev, [platform]: false }));
            setSearchedPlatforms((prev) => ({ ...prev, [platform]: true }));
            return { platform, success: true };
          } catch (error) {
            console.error(`${platform} 검색 실패:`, error);
            if (!searchCacheRef.current[currentKeyword]) {
              searchCacheRef.current[currentKeyword] = {};
            }
            searchCacheRef.current[currentKeyword][platform] = [];

            setResults((prev) => ({ ...prev, [platform]: [] }));
            setLoadingPlatforms((prev) => ({ ...prev, [platform]: false }));
            setSearchedPlatforms((prev) => ({ ...prev, [platform]: true }));
            return { platform, success: false };
          }
        });

        await Promise.allSettled(searchPromises);
    } catch (e) {
      console.error("검색 실패:", e);
      setSnackbar({
        open: true,
        message: "채널 검색 중 오류가 발생했습니다.",
        severity: "error",
      });
      setLoadingPlatforms({ chzzk: false, soop: false, youtube: false });
    } finally {
      setLoading(false);
    }
  }, [keyword, setSnackbar, enabledPlatforms]);

  const handlePlatformMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePlatformMenuClose = () => {
    setAnchorEl(null);
  };

  const selectPlatform = (platform) => {
    setSelectedPlatform(platform);
    updatePreferences({ selectedSearchPlatform: platform });
    handlePlatformMenuClose();
  };

  const togglePlatform = (platform) => {
    const willEnable = !platformEnabled[platform];
    setPlatformEnabled((prev) => ({ ...prev, [platform]: willEnable }));

    // 비활성화 시 현재 선택된 검색 플랫폼이었다면 전체 플랫폼으로 초기화
    if (!willEnable && selectedPlatform === platform) {
      setSelectedPlatform("");
      updatePreferences({ selectedSearchPlatform: "" });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(debounceTimeout.current);
      handleSearch();
    } else if (e.key === "Escape") {
      setShowList(false);
    }
  };

  useEffect(() => {
    clearTimeout(debounceTimeout.current);

    if (keyword.trim()) {
      debounceTimeout.current = setTimeout(handleSearch, 500);
    } else {
      searchCacheRef.current = {};
      setResults({ chzzk: [], soop: [], youtube: [] });
      setSearchedPlatforms({ chzzk: false, soop: false, youtube: false });
      setShowList(false);
    }

    return () => clearTimeout(debounceTimeout.current);
  }, [keyword, handleSearch]);

  const addChannel = (selectChannel) => {
    setChannels((prev) => {
      if (prev[selectChannel.id]) {
        setSnackbar({
          open: true,
          message: "이미 추가된 채널입니다.",
          severity: "warning",
        });
        return prev;
      }
      
      if (Object.keys(prev).length >= maxChannels) {
        setSnackbar({
          open: true,
          message: `채널은 최대 ${maxChannels}개까지 추가 가능합니다.`,
          severity: "warning",
        });
        return prev;
      }

      const updated = {
        ...prev,
        [selectChannel.id]: {
          ...selectChannel,
          isVisible: false,
          zoneId: null,
        },
      };

      const channelsToSave = Object.fromEntries(
        Object.entries(updated).map(([id, ch]) => [
          id,
          { platform: ch.platform, zoneId: ch.zoneId ?? null },
        ])
      );

      // 검색 결과에서 추가하는 것이므로 즉시 저장 (채팅 서버 상태와 무관하게 동작)
      updatePreferences({ channels: channelsToSave });

      return updated;
    });

    setKeyword("");
    setResults({ chzzk: [], soop: [], youtube: [] });
    setShowList(false);
  };

  return (
    <Box ref={containerRef} sx={{ position: "relative" }}>
      <TextField
        fullWidth
        placeholder="채널 검색..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
        sx={{
          input: { color: "text.primary", fontSize: "1.4rem" },
          "& .MuiOutlinedInput-root": {
            paddingLeft: "0.8rem",
            "& fieldset": { borderColor: "border.primary" },
            "&:hover fieldset": { borderColor: "border.secondary" },
            "&.Mui-focused fieldset": { borderColor: "primary.main" },
            "&.Mui-focused:hover fieldset": { borderColor: "primary.main" },
            "& .MuiInputAdornment-root": { marginRight: "0.4rem" }
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Tooltip {...tooltipProps} title="플랫폼 선택">
                <IconButton
                  onClick={handlePlatformMenuOpen}
                  size="small"
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    padding: 0,
                    overflow: "hidden",
                    backgroundColor: "background.level2",
                    "&:hover": {
                      backgroundColor: "background.level3",
                    },
                  }}
                >
                  {selectedPlatform && platformLogos[selectedPlatform] ? (
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        position: "relative",
                        borderRadius: "50%",
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={platformLogos[selectedPlatform]}
                        alt={platformNames[selectedPlatform]}
                        fill
                        sizes="24px"
                        style={{ objectFit: "cover" }}
                      />
                    </Box>
                  ) : (
                    <AppsIcon sx={{ fontSize: 16, color: "text.primary" }} />
                  )}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
          endAdornment: loading ? (
            <CircularProgress size={20} sx={{ color: "text.quaternary" }} />
          ) : null,
        }}
      />

      {/* 플랫폼 선택 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handlePlatformMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: "background.level2",
            borderRadius: "0.8rem",
            padding: "0.4rem",
            minWidth: "16rem",
          },
        }}
      >
        <MenuItem
          onClick={() => selectPlatform("")}
          selected={!selectedPlatform}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            padding: "0.8rem 1.2rem",
            borderRadius: "0.6rem",
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "background.level3",
            }}
          >
            <AppsIcon sx={{ fontSize: 16, color: "text.primary" }} />
          </Box>
          <Typography sx={{ fontSize: "1.3rem", color: "text.primary" }}>
            전체 플랫폼
          </Typography>
        </MenuItem>
        {ALL_PLATFORMS.map((platform) => {
          const isEnabled = platformEnabled[platform];
          return (
            <MenuItem
              key={platform}
              onClick={() => {
                if (isEnabled) selectPlatform(platform);
              }}
              disableRipple={!isEnabled}
              selected={selectedPlatform === platform}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                padding: "0.8rem 1.2rem",
                borderRadius: "0.6rem",
                cursor: isEnabled ? "pointer" : "default",
                opacity: isEnabled ? 1 : 0.45,
                "&.Mui-selected, &.Mui-selected:hover": {
                  backgroundColor: "background.level3",
                },
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  position: "relative",
                  borderRadius: "50%",
                  overflow: "hidden",
                  backgroundColor: "background.level3",
                  filter: isEnabled ? "none" : "grayscale(1)",
                }}
              >
                <Image
                  src={platformLogos[platform]}
                  alt={platformNames[platform]}
                  fill
                  sizes="24px"
                  style={{ objectFit: "cover" }}
                />
              </Box>
              <Typography sx={{ fontSize: "1.3rem", color: "text.primary", flex: 1 }}>
                {platformNames[platform]}
              </Typography>
              <Switch
                size="small"
                checked={isEnabled}
                onClick={(e) => e.stopPropagation()}
                onChange={() => togglePlatform(platform)}
              />
            </MenuItem>
          );
        })}
      </Menu>

      <Typography
        sx={{
          fontSize: "1.2rem",
          color: "text.disabled",
          textAlign: "right",
          mt: "0.4rem",
          mr: "0.4rem",
          userSelect: "none"
        }}
      >
        {Object.keys(channels).length} / {maxChannels}
      </Typography>

      {showList && (
        <Paper
          sx={(theme) => ({
            position: "absolute",
            top: "4.8rem",
            right: 0,
            left: 0,
            ...(!selectedPlatform && { width: { md: "auto" }, left: { xs: 0, sm: 0, md: "auto" } }),
            zIndex: 1000,
            backgroundColor: "background.level1",
            padding: "1.0rem",
            borderRadius: "0.6rem",
            boxShadow: `.0rem 0.4rem 1.0rem ${theme.palette.background.overlay}`,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          })}
        >
          {/* 플랫폼 선택 아이콘 바 */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              justifyContent: "flex-end",
              alignItems: "center",
              paddingBottom: "0.8rem",
              borderBottom: "1px solid",
              borderColor: "border.primary",
            }}
          >
            {/* 전체 플랫폼 선택 */}
            <Tooltip {...tooltipProps} title="전체 플랫폼">
              <IconButton
                onClick={() => {
                  setSelectedPlatform("");
                  updatePreferences({ selectedSearchPlatform: "" });
                }}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  padding: 0,
                  overflow: "hidden",
                  border: "2px solid",
                  borderColor:
                    !selectedPlatform
                      ? "primary.main"
                      : "transparent",
                  backgroundColor:
                    !selectedPlatform
                      ? "background.level3"
                      : "background.level2",
                  "&:hover": {
                    backgroundColor: "background.level3",
                    borderColor:
                      !selectedPlatform
                        ? "primary.main"
                        : "border.secondary",
                  },
                }}
              >
                <AppsIcon sx={{ fontSize: 20, color: "text.primary" }} />
              </IconButton>
            </Tooltip>

            {enabledPlatforms.map((platform) => (
              <Tooltip key={platform} {...tooltipProps} title={platformNames[platform]}>
                <IconButton
                  onClick={() => {
                    setSelectedPlatform(platform);
                    updatePreferences({ selectedSearchPlatform: platform });
                  }}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    padding: 0,
                    overflow: "hidden",
                    border: "2px solid",
                    borderColor:
                      selectedPlatform === platform
                        ? "primary.main"
                        : "transparent",
                    backgroundColor:
                      selectedPlatform === platform
                        ? "background.level3"
                        : "background.level2",
                    "&:hover": {
                      backgroundColor: "background.level3",
                      borderColor:
                        selectedPlatform === platform
                          ? "primary.main"
                          : "border.secondary",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      position: "relative",
                      borderRadius: "50%",
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      src={platformLogos[platform]}
                      alt={platformNames[platform]}
                      fill
                      sizes="36px"
                      style={{ objectFit: "cover" }}
                    />
                  </Box>
                </IconButton>
              </Tooltip>
            ))}
          </Box>

          {/* 검색 결과 표시 영역 */}
          <Box 
            sx={{ 
              display: "flex", 
              flexDirection: { xs: "column", sm: "column", md: "row" },
              gap: 2,
              maxHeight: { xs: "50rem", sm: "50rem", md: "none" },
              overflowY: { xs: "auto", sm: "auto", md: "visible" },
              ...(!selectedPlatform && { marginRight: { xs: "-0.4rem", sm: "-0.4rem", md: 0 } }),
            }}
          >
            {enabledPlatforms.map((platform) => {
              // 선택된 플랫폼이 있을 때는 선택된 것만 표시
              if (selectedPlatform && selectedPlatform !== platform) {
                return null;
              }

              return (
                <Box
                  key={platform}
                  sx={{
                    flex: { xs: "0 0 auto", md: "1" },
                    width: { xs: "100%", md: "245px" },
                    minWidth: { md: "22rem" },
                    backgroundColor: "background.level2",
                    borderRadius: "0.6rem",
                    padding: "0.8rem",
                  }}
                >
                  {loadingPlatforms[platform] ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "10rem",
                      }}
                    >
                      <CircularProgress size={24} sx={{ color: "text.quaternary" }} />
                    </Box>
                  ) : results[platform]?.length > 0 ? (
                    results[platform].map((ch) => (
                      <Box
                        key={`${ch.platform}-${ch.id}`}
                        sx={{
                          position: "relative",
                          padding: "0.6rem 0.4rem",
                          cursor: "pointer",
                          borderRadius: "0.4rem",
                          overflow: "hidden",
                          "&:hover .hoverOverlay": { opacity: 1 },
                          "&:hover .content": { opacity: 0.2 },
                        }}
                        onClick={() => addChannel(ch)}
                      >
                        <Box
                          className="content"
                          sx={{ transition: "opacity 0.2s" }}
                        >
                          <SearchChannelInfo searchChannel={ch} />
                        </Box>
                        <Box
                          className="hoverOverlay"
                          sx={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "background.overlay",
                            opacity: 0,
                            pointerEvents: "none",
                          }}
                        >
                          <AddIcon sx={{ fontSize: 36, color: "text.primary" }} />
                        </Box>
                      </Box>
                    ))
                  ) : searchedPlatforms[platform] ? (
                    <Typography
                      sx={{ color: "text.placeholder", fontSize: "1.3rem" }}
                    >
                      결과 없음
                    </Typography>
                  ) : null}
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
