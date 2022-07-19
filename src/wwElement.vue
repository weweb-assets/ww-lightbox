<template>
  <div class="ww-lightbox" :style="cssVariables">
    <div class="ww-lightbox__trigger" @click="handlerExplorer(true)">
      <wwElement v-bind="content.triggerLink" />
    </div>
    <!-- Editable content, visible only in edition mode.
    V-show mandatory because the elements present here must always be present in the DOM -->
    <div v-show="isExplorerVisible && isEditing" class="ww-lightbox__content">
      <div class="content-container">
        <template v-for="(el, index) in content.mediaElements" :key="index">
          <div
            v-show="index === mediaIndex"
            class="item-container"
            data-lightbox-media
            :data-lightbox-group="content.group"
            :data-lightbox-id="id"
            :data-isExplorerVisible="isExplorerVisible"
          >
            <wwElement
              @update:is-selected="onMediaSelectionChange($event, index)"
              v-bind="el"
            />
          </div>
        </template>
      </div>
    </div>
    <!-- Lightbox explorer. Visible only in preview mode or on the published site.
    Here will be injected the content of the lightbox from the editable content above.
    Or from other lightboxes if linked. See function createLightboxes -->
    <div
      v-show="isExplorerVisible && !isEditing"
      class="ww-lightbox__explorer"
      @mousemove="onMouseMove"
    >
      <div class="ww-lightbox__explorer-content">
        <Transition :name="activeTransition" mode="out-in">
          <div
            v-if="explorerHTML"
            class="content-container"
            v-html="explorerHTML"
            :key="`item-${lightboxIndex}`"
          />
        </Transition>
      </div>
    </div>
    <!-- Managing the navigation -->
    <div
      v-show="isExplorerVisible"
      class="explorer-nav -close"
      @click="handlerExplorer(false)"
    >
      <wwElement v-bind="content.closeIcon" />
    </div>
    <div v-show="showPrev" class="explorer-nav -prev" @click="explorerPrev">
      <wwElement v-bind="content.explorerArrows[0]" />
    </div>
    <div v-show="showNext" class="explorer-nav -next" @click="explorerNext">
      <wwElement v-bind="content.explorerArrows[1]" />
    </div>
    <div
      v-if="isExplorerSummary"
      class="ww-lightbox__summary"
      :class="{ active: isDrag }"
      ref="lightboxSummary"
      @mousedown="onMouseDown"
      @mouseup="onMouseUp"
      @mousemove="onMouseMove"
    >
      <div
        class="summary-item"
        v-for="(miniature, index) in groupMiniatures"
        :key="index"
        @click="changeIndex(index)"
      >
        <wwElement
          v-if="miniature.url"
          v-bind="content.miniatureElement"
          :wwProps="{ url: miniature.url }"
        />
      </div>
    </div>
  </div>
</template>

<script>
import useMiniatures from "./useMiniatures";

export default {
  props: {
    content: { type: Object, required: true },
    wwFrontState: { type: Object, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  emits: ["update:content:effect", "update:sidepanel-content"],
  setup(props) {
    const { id, groupMiniatures, linked } = useMiniatures(props);

    return { id, groupMiniatures, linked };
  },
  data() {
    return {
      isExplorerVisible: false,
      lightboxIndex: 0,
      explorerContent: [],
      activeTransition: "fadeLeft",
      isDrag: false,
      startX: null,
      scrollLeft: null,
    };
  },
  watch: {
    isEditing: {
      immediate: true,
      handler(val) {
        this.lightboxIndex = 0;
        this.$nextTick(() => {
          this.isExplorerVisible = false;
        });

        if (val) {
          this.$emit("update:sidepanel-content", {
            path: "mediaIndex",
            value: 0,
          });
        }
      },
    },
    "content.medias": {
      deep: true,
      async handler(newMedias, oldMedias) {
        if (newMedias && oldMedias && newMedias.length !== oldMedias.length)
          return;

        newMedias.forEach(async (media, index) => {
          if (media && oldMedias[index]) {
            if (media.media !== oldMedias[index].media) {
              const mediaElements = [...this.content.mediaElements];
              const elem = await wwLib.createElement(
                media.media,
                {},
                {
                  name: this.getElementName(media.media),
                },
                this.wwFrontState.sectionId
              );
              mediaElements[index] = elem;
              this.$emit("update:content:effect", { mediaElements });
            }
          }
        });
      },
    },
    "wwEditorState.sidepanelContent.displayGroup"(val) {
      if (val === false) {
        this.$emit("update:content:effect", {
          path: "group",
          value: "",
        });
      }
    },
    "wwEditorState.sidepanelContent.mediaIndex"() {
      this.isExplorerVisible = true;
    },
  },
  computed: {
    isEditing() {
      /* wwEditor:start */
      return (
        this.wwEditorState.editMode === wwLib.wwEditorHelper.EDIT_MODES.EDITION
      );
      /* wwEditor:end */
      // eslint-disable-next-line no-unreachable
      return false;
    },
    showPrev() {
      return (
        this.isExplorerVisible &&
        (!!this.explorerContent[this.lightboxIndex - 1] || this.isEditing)
      );
    },
    showNext() {
      return (
        this.isExplorerVisible &&
        (!!this.explorerContent[this.lightboxIndex + 1] || this.isEditing)
      );
    },
    cssVariables() {
      return {
        "--backdrop-color": this.content.backdropColor,
      };
    },
    explorerHTML() {
      return this.explorerContent[this.lightboxIndex] &&
        this.explorerContent[this.lightboxIndex].outerHTML
        ? this.explorerContent[this.lightboxIndex].outerHTML
        : null;
    },
    mediaIndex() {
      const mediaIndex =
        this.wwEditorState.sidepanelContent &&
        "mediaIndex" in this.wwEditorState.sidepanelContent
          ? this.wwEditorState.sidepanelContent.mediaIndex
          : 0;

      if (!this.content.mediaElements[mediaIndex]) {
        this.$emit("update:sidepanel-content", {
          path: "mediaIndex",
          value: 0,
        });

        return 0;
      }

      return this.isEditing ? mediaIndex : this.lightboxIndex;
    },
    isEditionSummary() {
      return (
        this.isEditing &&
        this.isExplorerVisible &&
        this.groupMiniatures[this.mediaIndex] &&
        this.groupMiniatures[this.mediaIndex].url
      );
    },
    isExplorerSummary() {
      return this.isExplorerVisible && this.groupMiniatures.length > 1;
    },
  },
  methods: {
    async handlerExplorer(val, fromToggleEdition = false) {
      if (!fromToggleEdition && this.isEditing) return;

      if (val) {
        this.createLightboxes();
        this.isExplorerVisible = true;
      } else {
        this.destroyExplorer();
        this.isExplorerVisible = false;
      }
    },
    createLightboxes() {
      let lightboxes;

      if (this.linked) {
        lightboxes = wwLib
          .getFrontDocument()
          .querySelectorAll("[data-lightbox-media]");
      } else {
        const nodeList = wwLib
          .getFrontDocument()
          .querySelectorAll("[data-lightbox-media]");

        lightboxes = Array.from(nodeList).filter(
          (el) => el.getAttribute("data-lightbox-id") === this.id
        );
      }

      this.destroyExplorer();

      for (let node of lightboxes) {
        let copy = false;
        const group = node.getAttribute("data-lightbox-group");
        const id = node.getAttribute("data-lightbox-id");

        if (!group.length && this.id === id) copy = true;
        if (group.length && group === this.content.group) copy = true;

        if (copy) {
          const clone = node.cloneNode(true);
          clone.removeAttribute("data-lightbox-media");

          // Sometime, the node will be clone with a v-show set to false (line 17)
          clone.style.display = "flex";
          this.explorerContent.push(clone);
        }
      }

      const list = Array.from(lightboxes);
      const indexInList = Array.prototype.indexOf.call(
        lightboxes,
        list.find((el) => el.getAttribute("data-lightbox-id") === this.id)
      );

      this.lightboxIndex = this.lightboxIndex.length > 1 ? indexInList : 0;
    },
    destroyExplorer() {
      this.explorerContent = [];
    },
    onMediaRemove(index) {
      const medias = [...this.content.medias];
      medias.splice(index, 1);

      const mediaElements = [...this.content.mediaElements];
      mediaElements.splice(index, 1);

      this.$emit("update:content:effect", { mediaElements, medias });
    },
    async onMediaAdded() {
      const medias = [...this.content.medias];
      if (medias.length === 0) {
        medias.push({ media: "ww-image" });
      } else {
        medias.push(_.cloneDeep(medias[medias.length - 1]));
      }

      const mediaElements = [...this.content.mediaElements];
      if (mediaElements.length === 0) {
        const elem = await wwLib.createElement(
          "ww-image",
          {},
          { name: "Media - Image" },
          this.wwFrontState.sectionId
        );
        mediaElements.push(elem);
      } else {
        const name = this.getElementName(medias[medias.length - 1].media);
        const elem = await wwLib.wwObjectHelper.cloneElement(
          mediaElements[mediaElements.length - 1].uid,
          this.wwFrontState.sectionId,
          name
        );
        mediaElements.push(elem);
      }

      this.$emit("update:content:effect", { mediaElements, medias });
    },
    changeIndex(index) {
      if (this.isEditing) return;
      this.activeTransition =
        index > this.lightboxIndex ? "fadeLeft" : "fadeRight";
      this.lightboxIndex = index;
    },
    explorerPrev() {
      if (!!this.explorerContent[this.lightboxIndex - 1]) {
        this.changeIndex(this.lightboxIndex - 1);
      }
    },
    explorerNext() {
      if (!!this.explorerContent[this.lightboxIndex + 1]) {
        this.changeIndex(this.lightboxIndex + 1);
      }
    },
    getElementName(type) {
      return type === "ww-image" ? "Media - Image" : "Media - Video";
    },
    onMediaSelectionChange(isSelected, index) {
      if (isSelected) {
        if (!this.isExplorerVisible) {
          this.isExplorerVisible = true;
        }

        this.$emit("update:sidepanel-content", {
          path: "mediaIndex",
          value: index,
        });
      }
    },
    onMouseDown(event) {
      if (this.isEditing) return;
      const summary = this.$refs.lightboxSummary;
      if (!summary) return;
      this.isDrag = true;
      this.startX = event.pageX - summary.offsetLeft;
      this.scrollLeft = summary.scrollLeft;
    },
    onMouseUp() {
      if (this.isEditing) return;
      this.isDrag = false;
    },
    onMouseMove(event) {
      if (this.isEditing) return;
      if (!this.isDrag) return;
      const summary = this.$refs.lightboxSummary;
      if (!summary) return;

      event.preventDefault();
      const x = event.pageX - summary.offsetLeft;
      const walk = (x - this.startX) * 2;
      summary.scrollLeft = this.scrollLeft - walk;
    },
    /* wwEditor:start */
    toggleEdition() {
      this.handlerExplorer(!this.isExplorerVisible, true);
    },
    /* wwEditor:false */
  },
};
</script>

<style lang="scss" scoped>
.ww-lightbox {
  position: inherit;

  &__explorer {
    z-index: 3;
    display: flex;
    direction: columns;
    justify-content: center;
    align-items: center;

    position: fixed;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;

    background-color: var(--backdrop-color);

    &-content {
      width: 100%;
    }

    .content-container {
      width: 100%;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
    }

    .item-container {
      width: 100%;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
    }
  }

  &__content {
    width: 100%;
    z-index: 101;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;

    background-color: var(--backdrop-color);

    .content-container {
      width: 100%;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
    }

    .item-container {
      width: 100%;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
    }
  }

  .explorer-nav {
    z-index: 102;
    position: fixed;

    z-index: 101;

    &.-close {
      top: 0px;
      right: 0px;
    }

    &.-prev {
      left: 0px;
      top: 50%;
      transform: translateY(-50%);
    }

    &.-next {
      right: 0px;
      top: 50%;
      transform: translateY(-50%);
    }
  }

  &__summary {
    width: 90%;
    overflow-x: auto;

    z-index: 102;
    position: fixed;
    bottom: 0px;
    left: 50%;
    transform: translateX(-50%);

    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    &.active {
      cursor: grabbing;
    }

    &::-webkit-scrollbar {
      display: none;
    }
  }
}

// FADE LEFT
.fadeLeft-enter-active,
.fadeLeft-leave-active {
  transition: all 0.4s;
}
.fadeLeft-enter-from,
.fadeLeft-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
// FADE RIGHT
.fadeRight-enter-active,
.fadeRight-leave-active {
  transition: all 0.4s;
}

.fadeRight-enter-from,
.fadeRight-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
