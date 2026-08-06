// "layout_hide" 접두사 레이아웃은 UI(토글 버튼, 숫자 단축키)에 노출하지 않고
// 설정 동기화에서 직접 입력해야만 적용된다. 항상 기본 레이아웃 뒤에 정의할 것.
export const isHiddenLayout = (key) => key.startsWith("layout_hide");

export const getVisibleLayoutKeys = (layouts) =>
  Object.keys(layouts ?? {}).filter((key) => !isHiddenLayout(key));

// view ratio
const r20_9 = (20 / 9) / (16 / 9);
const r9_20 = (9 / 20) / (16 / 9);
const _r16_9 = (16 / 9) / (16 / 9);
const r9_16 = (9 / 16) / (16 / 9);
const r16_10 = (16 / 10) / (16 / 9);
const r10_16 = (10 / 16) / (16 / 9);

// ##################
// #     20 : 9     #
// ##################
// val of canvas[ratio2].layouts[1][layout1]
const r20_9a11 = 100;

// val of canvas[ratio2].layouts[2][layout1]
const r20_9a21 = 100;
const _r20_9b21 = 28.8;

// val of canvas[ratio2].layouts[3][layout1]
const _r20_9a31 = 60;

// val of canvas[ratio2].layouts[4][layout1]
const _r20_9a41 = 71.2;

// ##################
// #     16 : 9     #
// ##################
// val of canvas[ratio2].layouts[1][layout1]
const r16_9a11 = 84;

// val of canvas[ratio2].layouts[2][layout1]
const r16_9a21 = 84;
const r16_9b21 = 28.8;

// val of canvas[ratio2].layouts[3][layout1]
const r16_9a31 = 60;

// val of canvas[ratio2].layouts[4][layout1]
const r16_9a41 = 71.2;

// ##################
// #     16 : 10    #
// ##################
// val of canvas[ratio3].layouts[1][layout1]
const r16_10a11 = 84;

// val of canvas[ratio3].layouts[2][layout1]
const r16_10a21 = 28.8;

// val of canvas[ratio3].layouts[3][layout1]
const r16_10a31 = 69;

// val of canvas[ratio3].layouts[4][layout1]
const _r16_10a41 = 84;

// val of canvas[ratio3].layouts[5][layout1]
const r16_10a51 = 84;

export const canvas = {
  "20:9": {
    landscape: {
      maxViewCount: 5,
      style: {
        aspectRatio: "20 / 9",
      },
      layouts: {
        1: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${r20_9a11 / r20_9}%`, height: `${r20_9a11}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r20_9a11 / r20_9}%`, width: `${(100 - r20_9a11 / r20_9)}%`, height: `100%` } },
            },
          },
        },
        2: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${r20_9a21 / r20_9}%`, height: `${r20_9a21}%` } },
              2: { id: 2, type: "view", style: { top: `0%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `${(100 * r20_9 - r20_9a21)}%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${100 - (100 * r20_9 - r20_9a21)}%` } },
              2: { id: 2, type: "chat", style: { display: "none" } },
            },
          },
          layout2: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${r20_9a21 / r20_9}%`, height: `${r20_9a21}%` } },
              2: { id: 2, type: "view", style: { top: `${100 - (100 * r20_9 - r20_9a21)}%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${100 - (100 * r20_9 - r20_9a21)}%` } },
              2: { id: 2, type: "chat", style: { display: "none" } },
            },
          },
        },
        3: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${r20_9a21 / r20_9}%`, height: `${r20_9a21}%` } },
              2: { id: 2, type: "view", style: { top: `0%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
              3: { id: 3, type: "view", style: { top: `${(100 * r20_9 - r20_9a21)}%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `${(100 * r20_9 - r20_9a21) * 2}%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${100 - (100 * r20_9 - r20_9a21) * 2}%` } },
              2: { id: 2, type: "chat", style: { display: "none" } },
              3: { id: 3, type: "chat", style: { display: "none" } },
            },
          },
          layout2: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${r20_9a21 / r20_9}%`, height: `${r20_9a21}%` } },
              2: { id: 2, type: "view", style: { top: `${100 - (100 * r20_9 - r20_9a21) * 2}%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
              3: { id: 3, type: "view", style: { top: `${100 - (100 * r20_9 - r20_9a21)}%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${100 - (100 * r20_9 - r20_9a21) * 2}%` } },
              2: { id: 2, type: "chat", style: { display: "none" } },
              3: { id: 3, type: "chat", style: { display: "none" } },
            },
          },
        },
        4: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${r20_9a21 / r20_9}%`, height: `${r20_9a21}%` } },
              2: { id: 2, type: "view", style: { top: `0%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
              3: { id: 3, type: "view", style: { top: `${(100 * r20_9 - r20_9a21)}%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
              4: { id: 4, type: "view", style: { top: `${(100 * r20_9 - r20_9a21) * 2}%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `${(100 * r20_9 - r20_9a21) * 3}%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${100 - (100 * r20_9 - r20_9a21) * 3}%` } },
              2: { id: 2, type: "chat", style: { display: "none" } },
              3: { id: 3, type: "chat", style: { display: "none" } },
              4: { id: 4, type: "chat", style: { display: "none" } },
            },
          },
          layout2: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${r20_9a21 / r20_9}%`, height: `${r20_9a21}%` } },
              2: { id: 2, type: "view", style: { top: `${100 - (100 * r20_9 - r20_9a21) * 3}%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
              3: { id: 3, type: "view", style: { top: `${100 - (100 * r20_9 - r20_9a21) * 2}%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
              4: { id: 4, type: "view", style: { top: `${100 - (100 * r20_9 - r20_9a21)}%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${100 - (100 * r20_9 - r20_9a21) * 3}%` } },
              2: { id: 2, type: "chat", style: { display: "none" } },
              3: { id: 3, type: "chat", style: { display: "none" } },
              4: { id: 4, type: "chat", style: { display: "none" } },
            },
          },
        },
        5: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${r20_9a21 / r20_9}%`, height: `${r20_9a21}%` } },
              2: { id: 2, type: "view", style: { top: `0%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
              3: { id: 3, type: "view", style: { top: `${(100 * r20_9 - r20_9a21)}%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
              4: { id: 4, type: "view", style: { top: `${(100 * r20_9 - r20_9a21) * 2}%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
              5: { id: 5, type: "view", style: { top: `${(100 * r20_9 - r20_9a21) * 3}%`, left: `${r20_9a21 / r20_9}%`, width: `${(100 - r20_9a21 / r20_9)}%`, height: `${(100 * r20_9 - r20_9a21)}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { display: "none" } },
              2: { id: 2, type: "chat", style: { display: "none" } },
              3: { id: 3, type: "chat", style: { display: "none" } },
              4: { id: 4, type: "chat", style: { display: "none" } },
            },
          },
          layout2: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `2%`, width: `${60 / r20_9}%`, height: `60%` } },
              2: { id: 2, type: "view", style: { top: `0%`, left: `${2 + (60 / r20_9)}%`, width: `${60 / r20_9}%`, height: `60%` } },
              3: { id: 3, type: "view", style: { top: `60%`, left: `2%`, width: `${40 / r20_9}%`, height: `40%` } },
              4: { id: 4, type: "view", style: { top: `60%`, left: `${2 + (40 / r20_9)}%`, width: `${40 / r20_9}%`, height: `40%` } },
              5: { id: 5, type: "view", style: { top: `60%`, left: `${2 + (40 / r20_9) * 2}%`, width: `${40 / r20_9}%`, height: `40%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { display: "none" } },
              2: { id: 2, type: "chat", style: { display: "none" } },
              3: { id: 3, type: "chat", style: { display: "none" } },
              4: { id: 4, type: "chat", style: { display: "none" } },
              5: { id: 5, type: "chat", style: { display: "none" } },
            },
          },
        },
      },
    },
    portrait: {
      maxViewCount: 4,
      style: {
        aspectRatio: "9 / 20",
      },
      layouts: {
        1: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `100%`, height: `${(100 * r9_20)}%`} },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `${(100 * r9_20)}%`, left: `0%`, width: `100%`, height: `${100 - (100 * r9_20)}%` } },
            },
          },
        },
        2: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `${(100 * r9_20)}%`, left: `0%`, width: `100%`, height: `${(100 * r9_20)}%`} },
              2: { id: 2, type: "view", style: { top: `0%`, left: `0%`, width: `100%`, height: `${(100 * r9_20)}%`} },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `${(100 * r9_20) * 2}%`, left: `0%`, width: `100%`, height: `${100 - (100 * r9_20) * 2}%` } },
              2: { id: 2, type: "chat", style: { display: "none" } },
            },
          },
        },
        3: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `${(100 * r9_20) * 2}%`, left: `0%`, width: `100%`, height: `${(100 * r9_20)}%`} },
              2: { id: 2, type: "view", style: { top: `${(100 * r9_20)}%`, left: `0%`, width: `100%`, height: `${(100 * r9_20)}%`} },
              3: { id: 3, type: "view", style: { top: `0%`, left: `0%`, width: `100%`, height: `${(100 * r9_20)}%`} },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `${(100 * r9_20) * 3}%`, left: `0%`, width: `100%`, height: `${100 - (100 * r9_20) * 3}%` } },
              2: { id: 2, type: "chat", style: { display: "none" } },
              3: { id: 3, type: "chat", style: { display: "none" } },
            },
          },
        },
        4: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `100%`, height: `${(100 * r9_20)}%`} },
              2: { id: 2, type: "view", style: { top: `${(100 * r9_20)}%`, left: `0%`, width: `100%`, height: `${(100 * r9_20)}%`} },
              3: { id: 3, type: "view", style: { top: `${(100 * r9_20) * 2}%`, left: `0%`, width: `100%`, height: `${(100 * r9_20)}%`} },
              4: { id: 4, type: "view", style: { top: `${(100 * r9_20) * 3}%`, left: `0%`, width: `100%`, height: `${(100 * r9_20)}%`} },
            },
            chat: {
              1: { id: 1, type: "chat", style: { display: "none" } },
              2: { id: 2, type: "chat", style: { display: "none" } },
              3: { id: 3, type: "chat", style: { display: "none" } },
              4: { id: 4, type: "chat", style: { display: "none" } },
            },
          },
        },
      },
    },
  },
  "16:9": {
    landscape: {
      maxViewCount: 5,
      style: {
        aspectRatio: "16 / 9",
      },
      layouts: {
        1: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `${(100 - r16_9a11) / 2}%`, left: `0%`, width: `${r16_9a11}%`, height: `${r16_9a11}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r16_9a11}%`, width: `${(100 - r16_9a11)}%`, height: `100%` } },
            },
          },
          layout2: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `100%`, height: `100%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { display: "none" } },
            },
          },
        },
        2: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${r16_9a21}%`, height: `${r16_9a21}%` } },
              2: { id: 2, type: "view", style: { top: `${(100 - r16_9b21)}%`, left: `${(100 - r16_9b21)}%`, width: `${r16_9b21}%`, height: `${r16_9b21}%`, zIndex: 1 } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r16_9a21}%`, width: `${(100 - r16_9a21)}%`, height: `${(100 - r16_9b21) * 5 / 8}%` } },
              2: { id: 2, type: "chat", style: { top: `${(100 - r16_9b21) * 5 / 8}%`, left: `${r16_9a21}%`, width: `${(100 - r16_9a21)}%`, height: `${(100 - r16_9b21) * 3 / 8}%` } },
            },
          },
          layout2: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${(100 - r16_9b21)}%`, height: `${(100 - r16_9b21)}%` } },
              2: { id: 2, type: "view", style: { top: `${(100 - r16_9b21)}%`, left: `${(100 - r16_9b21 * 2)}%`, width: `${r16_9b21}%`, height: `${r16_9b21}%`, zIndex: 1 } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${(100 - r16_9b21)}%`, width: `${r16_9b21}%`, height: "60%" } },
              2: { id: 2, type: "chat", style: { top: "60%", left: `${(100 - r16_9b21)}%`, width: `${r16_9b21}%`, height: "40%" } },
            },
          },
          layout3: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `50%`, height: `50%` } },
              2: { id: 2, type: "view", style: { top: `0%`, left: `50%`, width: `50%`, height: `50%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `50%`, left: `0%`, width: `50%`, height: `50%` } },
              2: { id: 2, type: "chat", style: { top: `50%`, left: `50%`, width: `50%`, height: `50%` } },
            },
          },
          layout4: {
            view: {
              1: { id: 1, type: "view", style: { top: `${(100 - r16_9a11) / 2}%`, left: `0%`, width: `${r16_9a11}%`, height: `${r16_9a11}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r16_9a11}%`, width: `${(100 - r16_9a11)}%`, height: `${200 / 3}%` } },
              2: { id: 2, type: "chat", style: { top: `${200 / 3}%`, left: `${r16_9a11}%`, width: `${(100 - r16_9a11)}%`, height: `${100 / 3}%` } },
            },
          },
          layout_hide1: {
            view: {
              1: { id: 1, type: "view", style: { top: `${(100 - r16_9a11) / 2}%`, left: `0%`, width: `${r16_9a11}%`, height: `${r16_9a11}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r16_9a11}%`, width: `${(100 - r16_9a11)}%`, height: `100%` } },
              2: { id: 2, type: "chat", style: { display: "none" } },
            },
          },
        },
        3: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${r16_9a31}%`, height: `${r16_9a31}%` } },
              2: { id: 2, type: "view", style: { top: `${r16_9a31}%`, left: `0%`, width: `${(100 - r16_9a31)}%`, height: `${(100 - r16_9a31)}%` } },
              3: { id: 3, type: "view", style: { top: `${r16_9a31}%`, left: `${(100 - r16_9a31)}%`, width: `${(100 - r16_9a31)}%`, height: `${(100 - r16_9a31)}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r16_9a31}%`, width: `${(100 - r16_9a31) * 2 - r16_9a31}%`, height: `${r16_9a31}%` } },
              2: { id: 2, type: "chat", style: { top: `0%`, left: `${(100 - r16_9a31) * 2}%`, width: `${100 - (100 - r16_9a31) * 2}%`, height: `50%` } },
              3: { id: 3, type: "chat", style: { top: `50%`, left: `${(100 - r16_9a31) * 2}%`, width: `${100 - (100 - r16_9a31) * 2}%`, height: `50%` } },
            },
          },
          layout2: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${(100 / 3)}%`, height: `${(100 / 3)}%` } },
              2: { id: 2, type: "view", style: { top: `0%`, left: `${(100 / 3)}%`, width: `${(100 / 3)}%`, height: `${(100 / 3)}%` } },
              3: { id: 3, type: "view", style: { top: `0%`, left: `${(100 / 3) * 2}%`, width: `${(100 / 3)}%`, height: `${(100 / 3)}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `${(100 / 3)}%`, left: `0%`, width: `${(100 / 3)}%`, height: `${100 - (100 / 3)}%` } },
              2: { id: 2, type: "chat", style: { top: `${(100 / 3)}%`, left: `${(100 / 3)}%`, width: `${(100 / 3)}%`, height: `${100 - (100 / 3)}%` } },
              3: { id: 3, type: "chat", style: { top: `${(100 / 3)}%`, left: `${(100 / 3) * 2}%`, width: `${(100 / 3)}%`, height: `${100 - (100 / 3)}%` } },
            },
          },
          layout3: {
            view: {
              1: { id: 1, type: "view", style: { top: `50%`, left: `0%`, width: `50%`, height: `50%` } },
              2: { id: 2, type: "view", style: { top: `0%`, left: `0%`, width: `50%`, height: `50%`, zIndex: 1 } },
              3: { id: 3, type: "view", style: { top: `0%`, left: `50%`, width: `50%`, height: `50%`, zIndex: 1 } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `50%`, left: `50%`, width: `${(50 / 3)}%`, height: `50%` } },
              2: { id: 2, type: "chat", style: { top: `50%`, left: `${50 + (50 / 3)}%`, width: `${(50 / 3)}%`, height: `50%` } },
              3: { id: 3, type: "chat", style: { top: `50%`, left: `${50 + (50 / 3) * 2}%`, width: `${(50 / 3)}%`, height: `50%` } },
            },
          },
          layout4: {
            view: {
              1: { id: 1, type: "view", style: { top: `${(100 - r16_9a11) / 2}%`, left: `0%`, width: `${r16_9a11}%`, height: `${r16_9a11}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r16_9a11}%`, width: `${(100 - r16_9a11)}%`, height: `50%` } },
              2: { id: 2, type: "chat", style: { top: `50%`, left: `${r16_9a11}%`, width: `${(100 - r16_9a11)}%`, height: `25%` } },
              3: { id: 3, type: "chat", style: { top: `75%`, left: `${r16_9a11}%`, width: `${(100 - r16_9a11)}%`, height: `25%` } },
            },
          },
        },
        4: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${r16_9a41}%`, height: `${r16_9a41}%` } },
              2: { id: 2, type: "view", style: { top: `${r16_9a41}%`, left: `0%`, width: `${(100 - r16_9a41)}%`, height: `${(100 - r16_9a41)}%` } },
              3: { id: 3, type: "view", style: { top: `${r16_9a41}%`, left: `${(100 - r16_9a41)}%`, width: `${(100 - r16_9a41)}%`, height: `${(100 - r16_9a41)}%` } },
              4: { id: 4, type: "view", style: { top: `${r16_9a41}%`, left: `${(100 - r16_9a41) * 2}%`, width: `${(100 - r16_9a41)}%`, height: `${(100 - r16_9a41)}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r16_9a41}%`, width: `${(100 - r16_9a41) * 3 - r16_9a41}%`, height: `${r16_9a41}%` } },
              2: { id: 2, type: "chat", style: { top: `0%`, left: `${(100 - r16_9a41) * 3}%`, width: `${100 - (100 - r16_9a41) * 3}%`, height: `${100 / 3}%` } },
              3: { id: 3, type: "chat", style: { top: `${100 / 3}%`, left: `${(100 - r16_9a41) * 3}%`, width: `${100 - (100 - r16_9a41) * 3}%`, height: `${100 / 3}%` } },
              4: { id: 4, type: "chat", style: { top: `${200 / 3}%`, left: `${(100 - r16_9a41) * 3}%`, width: `${100 - (100 - r16_9a41) * 3}%`, height: `${100 / 3}%` } },
            },
          },
          layout2: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `25%`, height: `25%` } },
              2: { id: 2, type: "view", style: { top: `0%`, left: `25%`, width: `25%`, height: `25%` } },
              3: { id: 3, type: "view", style: { top: `0%`, left: `50%`, width: `25%`, height: `25%` } },
              4: { id: 4, type: "view", style: { top: `0%`, left: "75%", width: `25%`, height: `25%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `25%`, left: `0%`, width: `25%`, height: "75%" } },
              2: { id: 2, type: "chat", style: { top: `25%`, left: `25%`, width: `25%`, height: "75%" } },
              3: { id: 3, type: "chat", style: { top: `25%`, left: `50%`, width: `25%`, height: "75%" } },
              4: { id: 4, type: "chat", style: { top: `25%`, left: "75%", width: `25%`, height: "75%" } },
            },
          },
          layout3: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `50%`, height: `50%` } },
              2: { id: 2, type: "view", style: { top: `0%`, left: `50%`, width: `50%`, height: `50%` } },
              3: { id: 3, type: "view", style: { top: `50%`, left: `0%`, width: `50%`, height: `50%` } },
              4: { id: 4, type: "view", style: { top: `50%`, left: `50%`, width: `50%`, height: `50%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { display: "none" } },
              2: { id: 2, type: "chat", style: { display: "none" } },
              3: { id: 3, type: "chat", style: { display: "none" } },
              4: { id: 4, type: "chat", style: { display: "none" } },
            },
          },
          layout4: {
            view: {
              1: { id: 1, type: "view", style: { top: `${(100 - r16_9a11) / 2}%`, left: `0%`, width: `${r16_9a11}%`, height: `${r16_9a11}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r16_9a11}%`, width: `${(100 - r16_9a11)}%`, height: `37%` } },
              2: { id: 2, type: "chat", style: { top: `37%`, left: `${r16_9a11}%`, width: `${(100 - r16_9a11)}%`, height: `21%` } },
              3: { id: 3, type: "chat", style: { top: `58%`, left: `${r16_9a11}%`, width: `${(100 - r16_9a11)}%`, height: `21%` } },
              4: { id: 4, type: "chat", style: { top: `79%`, left: `${r16_9a11}%`, width: `${(100 - r16_9a11)}%`, height: `21%` } },
            },
          },
        },
        5: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `${100 / 3}%`, width: `50%`, height: `50%` } },
              2: { id: 2, type: "view", style: { top: `50%`, left: `${100 / 3}%`, width: `50%`, height: `50%` } },
              3: { id: 3, type: "view", style: { top: `0%`, left: `0%`, width: `${100 / 3}%`, height: `${100 / 3}%` } },
              4: { id: 4, type: "view", style: { top: `${100 / 3}%`, left: `0%`, width: `${100 / 3}%`, height: `${100 / 3}%` } },
              5: { id: 5, type: "view", style: { top: `${(100 / 3) * 2}%`, left: `0%`, width: `${100 / 3}%`, height: `${100 / 3}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${(100 / 6) * 5}%`, width: `${(100 / 6)}%`, height: `50%` } },
              2: { id: 2, type: "chat", style: { top: `50%`, left: `${(100 / 6) * 5}%`, width: `${(100 / 6)}%`, height: `50%` } },
              3: { id: 3, type: "chat", style: { display: "none" } },
              4: { id: 4, type: "chat", style: { display: "none" } },
              5: { id: 5, type: "chat", style: { display: "none" } },
            },
          },
          layout2: {
            view: {
              1: { id: 1, type: "view", style: { top: `${(100 / 12)}%`, left: `0%`, width: `50%`, height: `50%` } },
              2: { id: 2, type: "view", style: { top: `${(100 / 12)}%`, left: `50%`, width: `50%`, height: `50%` } },
              3: { id: 3, type: "view", style: { top: `${(100 / 12) + 50}%`, left: `0%`, width: `${100 / 3}%`, height: `${100 / 3}%` } },
              4: { id: 4, type: "view", style: { top: `${(100 / 12) + 50}%`, left: `${100 / 3}%`, width: `${100 / 3}%`, height: `${100 / 3}%` } },
              5: { id: 5, type: "view", style: { top: `${(100 / 12) + 50}%`, left: `${(100 / 3) * 2}%`, width: `${100 / 3}%`, height: `${100 / 3}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { display: "none" } },
              2: { id: 2, type: "chat", style: { display: "none" } },
              3: { id: 3, type: "chat", style: { display: "none" } },
              4: { id: 4, type: "chat", style: { display: "none" } },
              5: { id: 5, type: "chat", style: { display: "none" } },
            },
          },
        },
      },
    },
    portrait: {
      maxViewCount: 3,
      style: {
        aspectRatio: "9 / 16",
      },
      layouts: {
        1: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `100%`, height: `${(100 * r9_16)}%`} },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `${(100 * r9_16)}%`, left: `0%`, width: `100%`, height: `${100 - (100 * r9_16)}%` } },
            },
          },
        },
        2: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `${(100 * r9_16)}%`, left: `0%`, width: `100%`, height: `${(100 * r9_16)}%`} },
              2: { id: 2, type: "view", style: { top: `0%`, left: `0%`, width: `100%`, height: `${(100 * r9_16)}%`} },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `${(100 * r9_16) * 2}%`, left: `0%`, width: `100%`, height: `${100 - (100 * r9_16)}%` } },
              2: { id: 2, type: "chat", style: { display: "none" } },
            },
          },
        },
        3: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `100%`, height: `${(100 * r9_16)}%`} },
              2: { id: 2, type: "view", style: { top: `${(100 * r9_16)}%`, left: `0%`, width: `100%`, height: `${(100 * r9_16)}%`} },
              3: { id: 3, type: "view", style: { top: `${(100 * r9_16) * 2}%`, left: `0%`, width: `100%`, height: `${(100 * r9_16)}%`} },
            },
            chat: {
              1: { id: 1, type: "chat", style: { display: "none" } },
              2: { id: 2, type: "chat", style: { display: "none" } },
              3: { id: 3, type: "chat", style: { display: "none" } },
            },
          },
        },
      },
    },
  },
  "16:10": {
    landscape: {
      maxViewCount: 5,
      style: {
        aspectRatio: "16 / 10",
      },
      layouts: {
        1: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `${(100 - r16_10a11 * r16_10) / 2}%`, left: `0%`, width: `${r16_10a11}%`, height: `${r16_10a11 * r16_10}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r16_10a11}%`, width: `${(100 - r16_10a11)}%`, height: `100%` } },
            },
          },
          layout2: {
            view: {
              1: { id: 1, type: "view", style: { top: `${(100 - 100 * r16_10) / 2}%`, left: `0%`, width: `100%`, height: `${100 * r16_10}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { display: "none" } },
            },
          },
        },
        2: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${(100 - r16_10a21 * r16_10) / r16_10}%`, height: `${(100 - r16_10a21 * r16_10)}%` } },
              2: { id: 2, type: "view", style: { top: `${(100 - r16_10a21 * r16_10)}%`, left: `${(100 - r16_10a21 * r16_10) / r16_10 - r16_10a21}%`, width: `${r16_10a21}%`, height: `${r16_10a21 * r16_10}%`, zIndex: 1 } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${(100 - r16_10a21 * r16_10) / r16_10}%`, width: `${(100 - (100 - r16_10a21 * r16_10) / r16_10)}%`, height: `${100 * 5 / 8}%` } },
              2: { id: 2, type: "chat", style: { top: `${100 * 5 / 8}%`, left: `${(100 - r16_10a21 * r16_10) / r16_10}%`, width: `${(100 - (100 - r16_10a21 * r16_10) / r16_10)}%`, height: `${100 * 3 / 8}%` } },
            },
          },
          layout2: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `50%`, height: `${50 * r16_10}%` } },
              2: { id: 2, type: "view", style: { top: `0%`, left: `50%`, width: `50%`, height: `${50 * r16_10}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `${50 * r16_10}%`, left: `0%`, width: `50%`, height: `${100 - 50 * r16_10}%` } },
              2: { id: 2, type: "chat", style: { top: `${50 * r16_10}%`, left: `50%`, width: `50%`, height: `${100 - 50 * r16_10}%` } },
            },
          },
          layout3: {
            view: {
              1: { id: 1, type: "view", style: { top: `${(100 - r16_10a11 * r16_10) / 2}%`, left: `0%`, width: `${r16_10a11}%`, height: `${r16_10a11 * r16_10}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r16_10a11}%`, width: `${(100 - r16_10a11)}%`, height: `${200 / 3}%` } },
              2: { id: 2, type: "chat", style: { top: `${200 / 3}%`, left: `${r16_10a11}%`, width: `${(100 - r16_10a11)}%`, height: `${100 / 3}%` } },
            },
          },
        },
        3: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${r16_10a31}%`, height: `${r16_10a31 * r16_10}%` } },
              2: { id: 2, type: "view", style: { top: `${r16_10a31 * r16_10}%`, left: `0%`, width: `${(100 - r16_10a31 * r16_10) / r16_10}%`, height: `${(100 - r16_10a31 * r16_10)}%` } },
              3: { id: 3, type: "view", style: { top: `${r16_10a31 * r16_10}%`, left: `${(100 - r16_10a31 * r16_10) / r16_10}%`, width: `${(100 - r16_10a31 * r16_10) / r16_10}%`, height: `${(100 - r16_10a31 * r16_10)}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r16_10a31}%`, width: `${((100 - r16_10a31 * r16_10) / r16_10) * 2 - r16_10a31}%`, height: `${r16_10a31 * r16_10}%` } },
              2: { id: 2, type: "chat", style: { top: `0%`, left: `${((100 - r16_10a31 * r16_10) / r16_10) * 2}%`, width: `${100 - ((100 - r16_10a31 * r16_10) / r16_10) * 2}%`, height: `${50}%` } },
              3: { id: 3, type: "chat", style: { top: `50%`, left: `${((100 - r16_10a31 * r16_10) / r16_10) * 2}%`, width: `${100 - ((100 - r16_10a31 * r16_10) / r16_10) * 2}%`, height: `${50}%` } },
            },
          },
          layout2: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${(100 / 3)}%`, height: `${(100 / 3) * r16_10}%` } },
              2: { id: 2, type: "view", style: { top: `0%`, left: `${(100 / 3)}%`, width: `${(100 / 3)}%`, height: `${(100 / 3) * r16_10}%` } },
              3: { id: 3, type: "view", style: { top: `0%`, left: `${(100 / 3) * 2}%`, width: `${(100 / 3)}%`, height: `${(100 / 3) * r16_10}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `${(100 / 3) * r16_10}%`, left: `0%`, width: `${(100 / 3)}%`, height: `${(100 - (100 / 3) * r16_10)}%` } },
              2: { id: 2, type: "chat", style: { top: `${(100 / 3) * r16_10}%`, left: `${(100 / 3)}%`, width: `${(100 / 3)}%`, height: `${(100 - (100 / 3) * r16_10)}%` } },
              3: { id: 3, type: "chat", style: { top: `${(100 / 3) * r16_10}%`, left: `${(100 / 3) * 2}%`, width: `${(100 / 3)}%`, height: `${(100 - (100 / 3) * r16_10)}%` } },
            },
          },
          layout3: {
            view: {
              1: { id: 1, type: "view", style: { top: `${(100 - r16_10a11 * r16_10) / 2}%`, left: `0%`, width: `${r16_10a11}%`, height: `${r16_10a11 * r16_10}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r16_10a11}%`, width: `${(100 - r16_10a11)}%`, height: `50%` } },
              2: { id: 2, type: "chat", style: { top: `50%`, left: `${r16_10a11}%`, width: `${(100 - r16_10a11)}%`, height: `25%` } },
              3: { id: 3, type: "chat", style: { top: `75%`, left: `${r16_10a11}%`, width: `${(100 - r16_10a11)}%`, height: `25%` } },
            },
          },
        },
        4: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${(75 / r16_10)}%`, height: `75%` } },
              2: { id: 2, type: "view", style: { top: `75%`, left: `0%`, width: `${(25 / r16_10)}%`, height: `25%` } },
              3: { id: 3, type: "view", style: { top: `75%`, left: `${(25 / r16_10)}%`, width: `${(25 / r16_10)}%`, height: `25%` } },
              4: { id: 4, type: "view", style: { top: `75%`, left: `${(25 / r16_10) * 2}%`, width: `${(25 / r16_10)}%`, height: `25%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${(75 / r16_10)}%`, width: `${100 - (75 / r16_10)}%`, height: `25%` } },
              2: { id: 2, type: "chat", style: { top: `25%`, left: `${(75 / r16_10)}%`, width: `${100 - (75 / r16_10)}%`, height: `25%` } },
              3: { id: 3, type: "chat", style: { top: `50%`, left: `${(75 / r16_10)}%`, width: `${100 - (75 / r16_10)}%`, height: `25%` } },
              4: { id: 4, type: "chat", style: { top: `75%`, left: `${(75 / r16_10)}%`, width: `${100 - (75 / r16_10)}%`, height: `25%` } },
            },
          },
          layout2: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${(100 - (100 / 3) * r16_10) / r16_10}%`, height: `${100 - (100 / 3) * r16_10}%` } },
              2: { id: 2, type: "view", style: { top: `${100 - (100 / 3) * r16_10}%`, left: `0%`, width: `${(100 / 3)}%`, height: `${(100 / 3) * r16_10}%` } },
              3: { id: 3, type: "view", style: { top: `${100 - (100 / 3) * r16_10}%`, left: `${(100 / 3)}%`, width: `${(100 / 3)}%`, height: `${(100 / 3) * r16_10}%` } },
              4: { id: 4, type: "view", style: { top: `${100 - (100 / 3) * r16_10}%`, left: `${(100 / 3) * 2}%`, width: `${(100 / 3)}%`, height: `${(100 / 3) * r16_10}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${(100 - (100 / 3) * r16_10) / r16_10}%`, width: `${(100 - (100 - (100 / 3) * r16_10) / r16_10)}%`, height: `${100 - (100 / 3) * r16_10}%` } },
              2: { id: 2, type: "chat", style: { display: "none" } },
              3: { id: 3, type: "chat", style: { display: "none" } },
              4: { id: 4, type: "chat", style: { display: "none" } },
            },
          },
          layout3: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `25%`, height: `${25 * r16_10}%` } },
              2: { id: 2, type: "view", style: { top: `0%`, left: `25%`, width: `25%`, height: `${25 * r16_10}%` } },
              3: { id: 3, type: "view", style: { top: `0%`, left: `50%`, width: `25%`, height: `${25 * r16_10}%` } },
              4: { id: 4, type: "view", style: { top: `0%`, left: "75%", width: `25%`, height: `${25 * r16_10}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `${25 * r16_10}%`, left: `0%`, width: `25%`, height: `${100 - (25 * r16_10)}%` } },
              2: { id: 2, type: "chat", style: { top: `${25 * r16_10}%`, left: `25%`, width: `25%`, height: `${100 - (25 * r16_10)}%` } },
              3: { id: 3, type: "chat", style: { top: `${25 * r16_10}%`, left: `50%`, width: `25%`, height: `${100 - (25 * r16_10)}%` } },
              4: { id: 4, type: "chat", style: { top: `${25 * r16_10}%`, left: "75%", width: `25%`, height: `${100 - (25 * r16_10)}%` } },
            },
          },
          layout4: {
            view: {
              1: { id: 1, type: "view", style: { top: `${50 - 50 * r16_10}%`, left: `0%`, width: `50%`, height: `${50 * r16_10}%` } },
              2: { id: 2, type: "view", style: { top: `${50 - 50 * r16_10}%`, left: `50%`, width: `50%`, height: `${50 * r16_10}%` } },
              3: { id: 3, type: "view", style: { top: `50%`, left: `0%`, width: `50%`, height: `${50 * r16_10}%` } },
              4: { id: 4, type: "view", style: { top: `50%`, left: `50%`, width: `50%`, height: `${50 * r16_10}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { display: "none" } },
              2: { id: 2, type: "chat", style: { display: "none" } },
              3: { id: 3, type: "chat", style: { display: "none" } },
              4: { id: 4, type: "chat", style: { display: "none" } },
            },
          },
          layout5: {
            view: {
              1: { id: 1, type: "view", style: { top: `${(100 - r16_10a51 * r16_10) / 2}%`, left: `0%`, width: `${r16_10a51}%`, height: `${r16_10a51 * r16_10}%` } },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${r16_10a51}%`, width: `${(100 - r16_10a51)}%`, height: `37%` } },
              2: { id: 2, type: "chat", style: { top: `37%`, left: `${r16_10a51}%`, width: `${(100 - r16_10a51)}%`, height: `21%` } },
              3: { id: 3, type: "chat", style: { top: `58%`, left: `${r16_10a51}%`, width: `${(100 - r16_10a51)}%`, height: `21%` } },
              4: { id: 4, type: "chat", style: { top: `79%`, left: `${r16_10a51}%`, width: `${(100 - r16_10a51)}%`, height: `21%` } },
            },
          },
        },
        5: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `${50 - (125 / 3) / r16_10}%`, width: `${50 / r16_10}%`, height: `50%` } },
              2: { id: 2, type: "view", style: { top: `50%`, left: `${50 - (125 / 3) / r16_10}%`, width: `${50 / r16_10}%`, height: `50%` } },
              3: { id: 3, type: "view", style: { top: `0%`, left: `${50 + (25 / 3) / r16_10}%`, width: `${(100 / 3) / r16_10}%`, height: `${100 / 3}%` } },
              4: { id: 4, type: "view", style: { top: `${100 / 3}%`, left: `${50 + (25 / 3) / r16_10}%`, width: `${(100 / 3) / r16_10}%`, height: `${100 / 3}%` } },
              5: { id: 5, type: "view", style: { top: `${(100 / 3) * 2}%`, left: `${50 + (25 / 3) / r16_10}%`, width: `${(100 / 3) / r16_10}%`, height: `${100 / 3}%` } },
            },
          },
          layout2: {
            view: {
              1: { id: 1, type: "view", style: { top: `${50 - (125 / 3) * r16_10}%`, left: `0%`, width: `50%`, height: `${50 * r16_10}%` } },
              2: { id: 2, type: "view", style: { top: `${50 - (125 / 3) * r16_10}%`, left: `50%`, width: `50%`, height: `${50 * r16_10}%` } },
              3: { id: 3, type: "view", style: { top: `${50 + (25 / 3) * r16_10}%`, left: `0%`, width: `${100 / 3}%`, height: `${(100 / 3) * r16_10}%` } },
              4: { id: 4, type: "view", style: { top: `${50 + (25 / 3) * r16_10}%`, left: `${100 / 3}%`, width: `${100 / 3}%`, height: `${(100 / 3) * r16_10}%` } },
              5: { id: 5, type: "view", style: { top: `${50 + (25 / 3) * r16_10}%`, left: `${(100 / 3) * 2}%`, width: `${100 / 3}%`, height: `${(100 / 3) * r16_10}%` } },
            },
          },
        },
      },
    },
    portrait: {
      maxViewCount: 4,
      style: {
        aspectRatio: "10 / 16",
      },
      layouts: {
        1: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `100%`, height: `${(100 * r10_16)}%`} },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `${(100 * r10_16)}%`, left: `0%`, width: `100%`, height: `${100 - (100 * r10_16)}%` } },
            },
          },
        },
        2: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `${(100 * r10_16)}%`, left: `0%`, width: `100%`, height: `${(100 * r10_16)}%`} },
              2: { id: 2, type: "view", style: { top: `0%`, left: `0%`, width: `100%`, height: `${(100 * r10_16)}%`} },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `${(100 * r10_16) * 2}%`, left: `0%`, width: `100%`, height: `${100 - (100 * r10_16)}%` } },
              2: { id: 2, type: "chat", style: { display: "none" } },
            },
          },
        },
        3: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `12.5%`, left: `0%`, width: `${(25 / r10_16)}%`, height: `25%`} },
              2: { id: 2, type: "view", style: { top: `37.5%`, left: `0%`, width: `${(25 / r10_16)}%`, height: `25%`} },
              3: { id: 3, type: "view", style: { top: `62.5%`, left: `0%`, width: `${(25 / r10_16)}%`, height: `25%`} },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `12.5%`, left: `${(25 / r10_16)}%`, width: `${100 - (25 / r10_16)}%`, height: `25%` } },
              2: { id: 2, type: "chat", style: { top: `37.5%`, left: `${(25 / r10_16)}%`, width: `${100 - (25 / r10_16)}%`, height: `25%` } },
              3: { id: 3, type: "chat", style: { top: `62.5%`, left: `${(25 / r10_16)}%`, width: `${100 - (25 / r10_16)}%`, height: `25%` } },
            },
          },
        },
        4: {
          layout1: {
            view: {
              1: { id: 1, type: "view", style: { top: `0%`, left: `0%`, width: `${(25 / r10_16)}%`, height: `25%`} },
              2: { id: 2, type: "view", style: { top: `25%`, left: `0%`, width: `${(25 / r10_16)}%`, height: `25%`} },
              3: { id: 3, type: "view", style: { top: `50%`, left: `0%`, width: `${(25 / r10_16)}%`, height: `25%`} },
              4: { id: 4, type: "view", style: { top: `75%`, left: `0%`, width: `${(25 / r10_16)}%`, height: `25%`} },
            },
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${(25 / r10_16)}%`, width: `${100 - (25 / r10_16)}%`, height: `25%` } },
              2: { id: 2, type: "chat", style: { top: `25%`, left: `${(25 / r10_16)}%`, width: `${100 - (25 / r10_16)}%`, height: `25%` } },
              3: { id: 3, type: "chat", style: { top: `50%`, left: `${(25 / r10_16)}%`, width: `${100 - (25 / r10_16)}%`, height: `25%` } },
              4: { id: 4, type: "chat", style: { top: `75%`, left: `${(25 / r10_16)}%`, width: `${100 - (25 / r10_16)}%`, height: `25%` } },
            },
          },
        },
      },
    },
  },
  "full": {
    landscape: {
      maxViewCount: 5,
      style: {},
      layouts: {
        1: {
          layout1: {
            dynamicView: { ratio: 16 / 9 },
            view: {
              1: { id: 1, type: "view", style: {} },
            },
            chat: {
              1: { id: 1, type: "chat", style: {} },
            },
          },
          layout2: {
            view: {},
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `0%`, width: `100%`, height: `100%` } },
            },
          },
        },
        2: {
          layout1: {
            dynamicView: { ratio: 16 / 9 },
            view: {
              1: { id: 1, type: "view", style: {} },
              2: { id: 2, type: "view", style: {} },
            },
            chat: {
              1: { id: 1, type: "chat", style: {} },
              2: { id: 2, type: "chat", style: {} },
            },
          },
          layout2: {
            dynamicView: { ratio: 16 / 9, viewCount: 1 },
            view: {
              1: { id: 1, type: "view", style: {} },
            },
            chat: {
              1: { id: 1, type: "chat", style: {} },
              2: { id: 2, type: "chat", style: {} },
            },
          },
          layout3: {
            view: {},
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${50 * 0}%`, width: `${50}%`, height: `100%` } },
              2: { id: 2, type: "chat", style: { top: `0%`, left: `${50 * 1}%`, width: `${50}%`, height: `100%` } },
            },
          },
        },
        3: {
          layout1: {
            dynamicView: { ratio: 16 / 9 },
            view: {
              1: { id: 1, type: "view", style: {} },
              2: { id: 2, type: "view", style: {} },
              3: { id: 3, type: "view", style: {} },
            },
            chat: {
              1: { id: 1, type: "chat", style: {} },
              2: { id: 2, type: "chat", style: {} },
              3: { id: 3, type: "chat", style: {} },
            },
          },
          layout2: {
            dynamicView: { ratio: 16 / 9, viewCount: 1 },
            view: {
              1: { id: 1, type: "view", style: {} },
            },
            chat: {
              1: { id: 1, type: "chat", style: {} },
              2: { id: 2, type: "chat", style: {} },
              3: { id: 3, type: "chat", style: {} },
            },
          },
          layout3: {
            view: {},
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${100 / 3 * 0}%`, width: `${100 / 3}%`, height: `100%` } },
              2: { id: 2, type: "chat", style: { top: `0%`, left: `${100 / 3 * 1}%`, width: `${100 / 3}%`, height: `100%` } },
              3: { id: 3, type: "chat", style: { top: `0%`, left: `${100 / 3 * 2}%`, width: `${100 / 3}%`, height: `100%` } },
            },
          },
        },
        4: {
          layout1: {
            dynamicView: { ratio: 16 / 9 },
            view: {
              1: { id: 1, type: "view", style: {} },
              2: { id: 2, type: "view", style: {} },
              3: { id: 3, type: "view", style: {} },
              4: { id: 4, type: "view", style: {} },
            },
            chat: {
              1: { id: 1, type: "chat", style: {} },
              2: { id: 2, type: "chat", style: {} },
              3: { id: 3, type: "chat", style: {} },
              4: { id: 4, type: "chat", style: {} },
            },
          },
          layout2: {
            dynamicView: { ratio: 16 / 9, viewCount: 1 },
            view: {
              1: { id: 1, type: "view", style: {} },
            },
            chat: {
              1: { id: 1, type: "chat", style: {} },
              2: { id: 2, type: "chat", style: {} },
              3: { id: 3, type: "chat", style: {} },
              4: { id: 4, type: "chat", style: {} },
            },
          },
          layout3: {
            view: {},
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${25 * 0}%`, width: `25%`, height: `100%` } },
              2: { id: 2, type: "chat", style: { top: `0%`, left: `${25 * 1}%`, width: `25%`, height: `100%` } },
              3: { id: 3, type: "chat", style: { top: `0%`, left: `${25 * 2}%`, width: `25%`, height: `100%` } },
              4: { id: 4, type: "chat", style: { top: `0%`, left: `${25 * 3}%`, width: `25%`, height: `100%` } },
            },
          },
        },
        5: {
          layout1: {
            dynamicView: { ratio: 16 / 9 },
            view: {
              1: { id: 1, type: "view", style: {} },
              2: { id: 2, type: "view", style: {} },
              3: { id: 3, type: "view", style: {} },
              4: { id: 4, type: "view", style: {} },
              5: { id: 5, type: "view", style: {} },
            },
            chat: {
              1: { id: 1, type: "chat", style: {} },
              2: { id: 2, type: "chat", style: {} },
              3: { id: 3, type: "chat", style: {} },
              4: { id: 4, type: "chat", style: {} },
              5: { id: 5, type: "chat", style: {} },
            },
          },
          layout2: {
            dynamicView: { ratio: 16 / 9, viewCount: 1 },
            view: {
              1: { id: 1, type: "view", style: {} },
            },
            chat: {
              1: { id: 1, type: "chat", style: {} },
              2: { id: 2, type: "chat", style: {} },
              3: { id: 3, type: "chat", style: {} },
              4: { id: 4, type: "chat", style: {} },
              5: { id: 5, type: "chat", style: {} },
            },
          },
          layout3: {
            view: {},
            chat: {
              1: { id: 1, type: "chat", style: { top: `0%`, left: `${20 * 0}%`, width: `20%`, height: `100%` } },
              2: { id: 2, type: "chat", style: { top: `0%`, left: `${20 * 1}%`, width: `20%`, height: `100%` } },
              3: { id: 3, type: "chat", style: { top: `0%`, left: `${20 * 2}%`, width: `20%`, height: `100%` } },
              4: { id: 4, type: "chat", style: { top: `0%`, left: `${20 * 3}%`, width: `20%`, height: `100%` } },
              5: { id: 5, type: "chat", style: { top: `0%`, left: `${20 * 4}%`, width: `20%`, height: `100%` } },
            },
          },
        },
      },
    },
  },
};