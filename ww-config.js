export default {
  editor: {
    label: {
      en: "Lightbox link",
    },
    icon: "fontawesome/solid/film",
    bubble: {
      icon: "fontawesome/solid/film",
    },
  },
  properties: {
    triggerContainer: {
      hidden: true,
      defaultValue: [],
      navigator: {
        group: "Link",
      },
    },
    mediaElements: {
      hidden: true,
      defaultValue: [
        {
          isWwObject: true,
          type: "ww-image",
          state: { name: "Media - Image" },
        },
      ],
      navigator: {
        group: "Content",
      },
    },
    miniatureElement: {
      hidden: true,
      defaultValue: {
        isWwObject: true,
        type: "ww-image",
        state: { name: "Miniature - Image" },
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
        group: "Navigation icons",
      },
    },
    explorerArrows: {
      hidden: true,
      defaultValue: [
        { isWwObject: true, type: "ww-icon", state: { name: "Left arrow" } },
        { isWwObject: true, type: "ww-icon", state: { name: "Right arrow" } },
      ],
      navigator: {
        group: "Navigation icons",
      },
    },
    edit: {
      type: "OnOff",
      label: {
        en: "Edit lightbox",
        fr: "Edit lightbox",
      },
      defaultValue: false,
    },
    medias: {
      hidden: (content) => !content.edit,
      label: { en: "Medias", fr: "Medias" },
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
                  en: "Miniature image",
                  fr: "Miniature image",
                },
                bindable: true,
              },
            },
          },
          defaultValue: { media: "ww-image" },
        },
        onRemove: "onMediaRemove",
        onAdd: "onMediaAdded",
      },
      defaultValue: [{ media: "ww-image" }],
    },
    mediaIndex: {
      hidden: (content) => !content.edit || content.medias.length <= 1,
      label: { en: "Selected media", fr: "Media selectionné" },
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
    backdropColor: {
      hidden: (content) => !content.edit,
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
    linked: {
      hidden: (content) => !content.edit,
      type: "OnOff",
      label: {
        en: "Link with other lightboxes",
        fr: "Link with other lightboxes",
      },
      defaultValue: false,
    },
    group: {
      hidden: (content) => !content.linked || !content.edit,
      label: { en: "lightbox group" },
      type: "Text",
      options: {
        placeholder: "Groupe name",
      },
      defaultValue: "",
      bindable: true,
    },
  },
};
