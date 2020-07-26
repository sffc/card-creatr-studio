/*
 * Copyright (C) 2019 Shane F. Carr
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

"use strict";

let template = `
<div>
	<table class="card-list" v-bind:style="{ 'min-width': tableWidth + 'px' }">
		<thead v-bind:class="{ sortReversed: sortReversed }">
			<tr>
				<th class="left-buffer" v-on:click.stop="resetSort()">\u25A0</th>
				<th v-for="field in fields" v-bind:style="{ 'min-width': field.width + 'px', 'width': (field.width/tableWidth*100) + '%' }" v-on:click.stop="onColumnClick(field)" v-bind:class="{ active: sortField === field }">
					{{ field.name }}
				</th>
			</tr>
		</thead>
		<tbody>
			<card-row v-for="card in sortedCards" :key="card.id" :card="card" :fields="fields" v-on:click.stop="onRowClick(card)" :active="modelValue === card.id"></card-row>
		</tbody>
	</table>
	<div class="below-card-list">
		<button v-on:click.stop="newCard">+ Add Card</button>
		<button v-if="modelValue" v-on:click.stop="copyCard">+ Copy Card</button>
	</div>
</div>
`;

//<script>
module.exports = {
	template,
	components: {
		"card-row": require("./card_row"),
	},
	props: ["cards", "cardIdSortOrder", "fields", "modelValue"],
	emits: ["update:modelValue", "new"],
	data() {
		return {
			sortField: null,
			sortReversed: false,
			sortedCards: null
		};
	},
	computed: {
		tableWidth() {
			if (!this.fields) return 1;
			return Object.keys(this.fields).reduce((s,fieldId) => { return s + parseInt(this.fields[fieldId].width); }, 0);
		},
	},
	methods: {
		onRowClick(card) {
			this.$emit("update:modelValue", card.id);
		},
		onColumnClick(field) {
			if (this.sortField === field) {
				this.sortReversed = !this.sortReversed;
			} else {
				this.sortField = field;
			}
		},
		resetSort() {
			this.sortField = null;
			this.sortReversed = false;
		},
		doSort() {
			// This is in an explicit watch-method instead of a computed in order to avoid re-sorting rows when card content changes.
			if (this.cards === null) return null;

			if (!this.sortField) {
				// Use the natural sort order from cardIdSortOrder
				let cardsArray = [];
				for (let cardId of this.cardIdSortOrder) {
					cardsArray.push(this.cards[cardId]);
				}
				return cardsArray;
			}

			let cardsArray = Object.keys(this.cards).map((cardId) => { return this.cards[cardId]; });
			let name = this.sortField ? this.sortField.id : "id";
			let reversed = !!this.sortReversed;
			cardsArray.sort((cardA, cardB) => {
				let a = cardA[name];
				let b = cardB[name];
				if (a instanceof Array && b instanceof Array) {
					a = a.join("");
					b = b.join("");
				}
				a ||= "";
				b ||= "";
				if (this.sortField && (this.sortField.properties.indexOf("uint") !== -1 || this.sortField.properties.indexOf("number") !== -1)) {
					a = parseFloat(a) || 0;
					b = parseFloat(b) || 0;
				}
				if (a > b) {
					return reversed ? -1 : 1;
				} else if (a < b) {
					return reversed ? 1 : -1;
				} else {
					return 0;
				}
			});
			return cardsArray;
		},
		newCard() {
			this.resetSort();
			this.$emit("new");
		},
		copyCard: function () {
			this.resetSort();
			this.$emit("copy");
		}
	},
	watch: {
		sortField: {
			handler() {
				this.sortedCards = this.doSort();
			},
			immediate: true
		},
		sortReversed: {
			handler() {
				this.sortedCards = this.doSort();
			},
			immediate: true
		},
		cardIdSortOrder: {
			handler() {
				this.sortedCards = this.doSort();
			},
			deep: true
		}
	}
};
//</script>
