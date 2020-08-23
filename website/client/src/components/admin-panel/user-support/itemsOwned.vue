<template>
  <div class="accordion-group">
    <h3
      class="expand-toggle"
      :class="{'open': expand}"
      @click="expand = !expand"
    >
      Items
    </h3>
    <div v-if="expand">
      <p>
        The sections below display each item's key (bolded if the player has ever owned it),
        followed by the item's English name.
        Use the key (not name!) to change the amount owned or the true/false value.
        Click "Change" to auto-fill "Update Items" with key and current amount/value.
      </p>

      <div
        v-for="itemType in itemTypes"
        :key="itemType"
      >
        <div class="accordion-group">
          <h4
            class="expand-toggle"
            :class="{'open': expandItemType[itemType]}"
            @click="expandItemType[itemType] = !expandItemType[itemType]"
          >
            {{ itemType }}
          </h4>
          <form @submit.prevent="saveHero({hero, msg: 'Items', clearData: false})">
            <!-- XXX UPTOHERE saveHero can't save the whole object,
            it expects data for putting in this:
            if (updateData.itemPath && updateData.itemVal && validateItemPath(updateData.itemPath))
              _.set(hero, updateData.itemPath, castItemVal(updateData.itemPath, updateData.itemVal))
            }
            Must change the Save button to apply to each line item and NOT clear data after saving.
            I need to fix castItemVal so it works correctly for mounts ffs, and fix the tests.
            -->

            <!-- XXX_SOON work out if clearData needed and if so indicate that in the button -->
            <!-- XXX_SOON document above that save is clicked after making all changes -->
            <!-- XXX_SOON add to docs that you click on underlined text to toggle
              (list the values, eg null) for mounts and gear -->

            <div v-if="expandItemType[itemType]">
              <p v-if="itemType === 'pets'">
                A value of -1 means they owned the Pet but Released it
                and have not yet rehatched it.
              </p>
              <p v-if="itemType === 'mounts'">
                A value of "null" means they owned the Mount but Released it
                and have not yet retamed it.
              </p>
              <p v-if="itemType === 'special'">
                When there are 0 of these items, we can't tell if
                they had been owned and were all used, or have never been owned.
              </p>
              <p v-if="itemType === 'gear'">
                A value of true means they own the item now and can wear it.
                A value of false means they used to own it but lost it from Death
                (or an old Rebirth).
              </p>

              <input
                type="submit"
                value="Save Items"
                class="btn btn-primary"
              >
              <ul>
                <li
                  v-for="item in collatedItemData[itemType]"
                  :key="item.key"
                  class="form-group form-inline"
                ><!-- XXX are form classes needed? -->

                  <span
                    v-if="itemType === 'mounts' || itemType === 'gear'"
                    class="textToggle"
                    @click="toggleNonIntegerValue(item)"
                  >
                    {{ item | displayNonIntegerValue }}
                  </span>
                  <span
                    v-else><!-- XXX add input form field -->
                    {{ item | displayIntegerValue }}
                  </span>
                  :
                  <span :class="{ ownedItem: !item.neverOwned }">{{ item.key }} :</span>
                  <span v-html="item.name"></span>
                  <input
                    value="Change"
                    class="btn btn-primary"
                    @click="showItem(item)"
                  >
                  >
                </li>
              </ul>

            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .ownedItem {
    font-weight: bold;
  }
  .textToggle {
    text-decoration: underline;
  }
</style>

<script>
import _ from 'lodash';
import content from '@/../../common/script/content';
import getItemDescription from '../mixins/getItemDescription';
import saveHero from '../mixins/saveHero';

function collateItemData (self) {
  const collatedItemData = {};
  self.itemTypes.forEach(itemType => {
    // itemTypes are pets, food, gear, etc

    // Set up some basic data for this itemType:
    let basePath = `items.${itemType}`;
    let ownedItems = self.hero.items[itemType] || {};
    let allItems = content[itemType];
    if (itemType === 'gear') {
      basePath = 'items.gear.owned';
      ownedItems = self.hero.items.gear.owned || {};
      allItems = content.gear.flat;
    }
    const itemData = []; // all items for this itemType

    // Collate data for items that the user owns or used to own:
    for (const key of Object.keys(ownedItems)) {
      // Do not sort keys. The order in the items object gives hints about order received.
      if (itemType !== 'special' || self.specialItems.includes(key)) {
        itemData.push({
          neverOwned: false,
          itemType,
          key,
          name: self.getItemDescription(itemType, key),
          path: `${basePath}.${key}`,
          value: ownedItems[key],
        });
      }
    }

    // Collate data for items that the user never owned:
    for (const key of Object.keys(allItems).sort()) {
      if (
        // ignore items the user owns because we captured them above:
        !(key in ownedItems)

        // ignore gear items that indicate empty equipped slots (e.g., head_base_0):
        && !(itemType === 'gear' && content.gear.flat[key].set
          && content.gear.flat[key].set === 'base-0')

        // ignore "special" items that aren't Snowballs, Seafoam, etc:
        && (itemType !== 'special' || self.specialItems.includes(key))
      ) {
        let value;
        if (self.nonIntegerTypes.includes(itemType)) {
          // XXX maybe don't need this if-else block. If do need it, try to use it with textToggle
          value = ''; // we want no default value in the "Update Items" input box
          // XXX make sure "never owned" is displayed for mounts and gear
        } else {
          value = 0;
          // XXX may be better to have '' here too
        }
        itemData.push({
          neverOwned: true,
          itemType,
          key,
          name: self.getItemDescription(itemType, key),
          path: `${basePath}.${key}`,
          value,
        });
      }
    }
    collatedItemData[itemType] = itemData;
  });
  return collatedItemData;
}

function resetData (self) {
  self.collatedItemData = collateItemData(self);
  self.itemTypes.forEach(itemType => { self.expandItemType[itemType] = false; });
  self.expand = true; // TST
  self.expandItemType.mounts = true; // TST
  // self.expandItemType.pets = true; // TST
}

export default {
  mixins: [
    getItemDescription,
    saveHero,
  ],
  filters: {
    displayIntegerValue (item) { // XXX needed?
      // XXX make form field here?
      // XXX ensure "never owned" is displayed when needed
      return item.value;
    },
    displayNonIntegerValue (item) {
      if (item.value === '') return 'never owned';
      if (item.value === null) return 'null'; // we need visible text
      return item.value; // true or false
    },
  },
  props: {
    resetCounter: {
      type: Number,
      required: true,
    },
    hero: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      expand: false,
      expandItemType: {
        eggs: false,
        hatchingPotions: false,
        food: false,
        pets: false,
        mounts: true, // TST use false
        quests: false,
        gear: false,
        special: false,
      },
      itemTypes: ['eggs', 'hatchingPotions', 'food', 'pets', 'mounts', 'quests', 'gear', 'special'],
      nonIntegerTypes: ['mounts', 'gear'],
      // items.special includes many things but we are interested in these only:
      specialItems: ['snowball', 'spookySparkles', 'shinySeed', 'seafoam'],
      collatedItemData: {},
    };
  },
  watch: {
    resetCounter () {
      resetData(this);
    },
  },
  mounted () {
    resetData(this);
  },
  methods: {
    changeData (path, currentValue) {
      // XXX @TODO improve this, update all docs above, see if clear-data is needed
      // XXX need this to set any integer value: _.set(this.hero, item.path, Number(item.value));
      // XXX_SOON add validation for new values for pets (-1, 5-45, 0??) - best add in hall.js
      this.expandUpdateItems = true;
      this.expand = true;
      this.hero.itemPath = path;
      this.hero.itemVal = currentValue;
    },
    showItem (item) {
      console.log(item);
      console.log(this.hero.items.mounts);
    },
    toggleNonIntegerValue (item) {
      // @TODO add a delete option
      if (item.itemType === 'gear') {
        // Allowed starting values are true, false, and "never owned"
        // Allowed values to switch to are true and false
        item.value = !item.value;
      } else if (item.itemType === 'mounts') {
        // Allowed starting values are true, null, and "never owned"
        // Allowed values to switch to are true and null
        if (item.value === true) {
          item.value = null;
        } else {
          item.value = true;
        }
      }
      console.log(this.hero.items.mounts['BearCub-Desert']); // TST // eslint-disable-line no-console
      console.log('item.path: '); console.log(item.path); // TST // eslint-disable-line no-console
      console.log('item.value: '); console.log(item.value); // TST // eslint-disable-line no-console
      console.log(' '); // TST // eslint-disable-line no-console
      _.set(this.hero, item.path, item.value);
      console.log(this.hero.items.mounts['BearCub-Desert']); // TST // eslint-disable-line no-console
    },
  },
};
</script>
