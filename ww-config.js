export default {
  editor: {
    label: {
      en: "Lightbox",
    },
    icon: "fontawesome/solid/film",
    bubble: {
      icon: "fontawesome/solid/film",
    },
  },
  properties: {
    triggerLink: {
      hidden: true,
      defaultValue: {
        isWwObject: true,
        type: "ww-flexbox",
        state: { name: "Link container" },
      },
    },
    mediaElements: {
      hidden: true,
      defaultValue: [
        {
          isWwObject: true,
          type: "ww-image",
          state: {
            name: "Media - Image",
            style: { default: { width: "70%" } },
          },
        },
      ],
      navigator: {
        group: "Popup",
      },
    },
    miniatureElement: {
      hidden: true,
      defaultValue: {
        isWwObject: true,
        type: "ww-image",
        state: {
          name: "Miniature - Image",
          style: { default: { width: "150px" } },
        },
      },
      navigator: {
        group: "Miniatures",
      },
    },
    closeIcon: {
      hidden: true,
      defaultValue: {
        isWwObject: true,
        type: "ww-icon",
        state: { name: "Close icon" },
      },
      navigator: {
        group: "Popup",
      },
    },
    explorerArrows: {
      hidden: true,
      defaultValue: [
        { isWwObject: true, type: "ww-icon", state: { name: "Left arrow" } },
        { isWwObject: true, type: "ww-icon", state: { name: "Right arrow" } },
      ],
      navigator: {
        group: "Popup",
      },
    },
    isVisible: {
      type: "OnOff",
      section: "settings",
      label: {
        en: "Show lightbox",
        fr: "Show lightbox",
      },
      bindable: true,
      defaultValue: false,
    },
    mediaIndex: {
      hidden: (content) => content.medias.length <= 1,
      label: { en: "Selected media", fr: "Media selectionné" },
      section: "settings",
      type: "Tabs",
      editorOnly: true,
      options: (content) => {
        return {
          labels: content.medias.map((_, index) => {
            return {
              label: `Media ${index + 1}`,
            };
          }),
          prefixLabel: "Slide",
          nbTabs: content.medias.length,
          fixed: true,
        };
      },
      defaultValue: 0,
    },
    medias: {
      label: { en: "Medias", fr: "Medias" },
      section: "settings",
      type: "Array",
      options: {
        item: {
          type: "Object",
          options: {
            item: {
              media: {
                type: "TextSelect",
                label: {
                  en: "Type",
                  fr: "Type",
                },
                options: {
                  options: [
                    {
                      value: "ww-video",
                      label: { en: "Video", fr: "Video" },
                    },
                    {
                      value: "ww-image",
                      label: { en: "Image", fr: "Image" },
                    },
                  ],
                },
              },
              miniature: {
                type: "Image",
                label: {
                  en: "Miniature",
                  fr: "Miniature",
                },
                bindable: true,
              },
            },
          },
          defaultValue: { media: "ww-image" },
        },
        navigator: {
          group: "Popup",
        },
        remove: "onMediaRemove",
        add: "onMediaAdded",
      },

      defaultValue: [{ media: "ww-image" }],
    },
    backdropColor: {
      type: "Color",
      label: {
        en: "Backdrop color",
        fr: "Backdrop color",
      },
      options: {
        nullable: true,
        gradient: true,
      },
      defaultValue: "#000000",
      bindable: true,
    },
    displayGroup: {
      type: "OnOff",
      section: "settings",
      label: {
        en: "Link with other lightboxes",
        fr: "Link with other lightboxes",
      },
      defaultValue: false,
      editorOnly: true,
    },
    group: {
      hidden: (_, sidepanelContent) => !sidepanelContent.displayGroup,
      label: { en: "lightbox group" },
      section: "settings",
      type: "Text",
      options: {
        placeholder: "Groupe name",
      },
      defaultValue: "",
      bindable: true,
    },
  },
};
