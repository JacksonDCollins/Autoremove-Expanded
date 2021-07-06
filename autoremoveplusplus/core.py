#
# core.py
#
# Copyright (C) 2020 Ervin Toth <tote.ervin@gmail.com>
# Copyright (C) 2014-2016 Omar Alvarez <osurfer3@hotmail.com>
# Copyright (C) 2013 Sven Klomp <mail@klomp.eu>
# Copyright (C) 2011 Jamie Lennox <jamielennox@gmail.com>
#
# Basic plugin template created by:
# Copyright (C) 2008 Martijn Voncken <mvoncken@gmail.com>
# Copyright (C) 2007-2009 Andrew Resch <andrewresch@gmail.com>
# Copyright (C) 2009 Damien Churchill <damoxc@gmail.com>
#
# Deluge is free software.
#
# You may redistribute it and/or modify it under the terms of the
# GNU General Public License, as published by the Free Software
# Foundation; either version 3 of the License, or (at your option)
# any later version.
#
# deluge is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with deluge. If not, write to:
#   The Free Software Foundation, Inc.,
#   51 Franklin Street, Fifth Floor
#   Boston, MA  02110-1301, USA.
#
# In addition, as a special exception, the copyright holders give
# permission to link the code of portions of this program with the OpenSSL
# library.
#
# You must obey the GNU General Public License in all respects for all of
# the code used other than OpenSSL. If you modify file(s) with this
# exception, you may extend this exception to your version of the file(s),
# but you are not obligated to do so. If you do not wish to do so, delete
# this exception statement from your version. If you delete this exception
# statement from all source files in the program, then also delete it here.
#

from __future__ import unicode_literals

from deluge.log import LOG as log
from deluge.plugins.pluginbase import CorePluginBase
import deluge.component as component
import deluge.configmanager
from deluge.core.rpcserver import export

from .torrent import torrentmanager
from .data_structs import wanted_params

from twisted.internet import reactor
from twisted.internet.task import LoopingCall, deferLater

import time

DEFAULT_PREFS = {
	'enabled': False
}

def conf_keys_to_list(conf):
	return list(conf.config.keys())


def arrayify(iter):
	if isinstance(iter, list):
		for i, item in enumerate(iter):
			iter[i] == arrayify(iter[i])
		return iter

	if isinstance(iter, tuple):
		nlist = []
		for i, item in enumerate(iter):
			nlist.append(arrayify(iter[i]))
		return nlist

	if isinstance(iter, dict):
		for k,v in iter.items():
			iter[k] = arrayify(v)
		return iter

	return iter



class Core(CorePluginBase):
	def enable(self):
		log.debug("AutoRemovePlusPlus: Enabled")

		self.config = deluge.configmanager.ConfigManager(
			"autoremoveplusplus.conf",
			DEFAULT_PREFS
		)
		# Safe after loading to have a default configuration if no gtkui
		self.conds = deluge.configmanager.ConfigManager("autoremoveplusplus-conds.conf",
			{"test":["availability", "hour",1]})

		self.rules = deluge.configmanager.ConfigManager("autoremoveplusplus-rules.conf",
			{"test_label": [["test", 1], ["test2", 2]], "any": [["test", 1], ["test2", 2]], 'none': [["test", 1], ["test2", 2]]})

		self.rules.save()
		self.conds.save()
		self.config.save()

		self.torrentmanager = torrentmanager(component.get("TorrentManager"))

		self.enabled = self.config['enabled']

		# it appears that if the plugin is enabled on boot then it is called
		# before the torrents are properly loaded and so do_remove receives an
		# empty list. So we must listen to SessionStarted for when deluge boots
		#  but we still have apply_now so that if the plugin is enabled
		# mid-program do_remove is still run
		self.looped = True
		self.looping_call = LoopingCall(lambda: self.update(looping = True))
		deferLater(reactor, 10, self.start_looping)



	def start_looping(self):
		self.looping_call.start(1)

	def disable(self):
		self.looping_call.stop()

	def update(self, looping = False):
		self.enabled = self.config['enabled']

		if self.enabled:
			log.info(self.looped)
			self.looped = looping
			if not self.looped:
				try:
					self.looping_call.stop()
				except:
					pass

			log.info("update")
			self.torrentmanager.update()
		# for torrent in self.torrentmanager:
		# 	log.info(torrent.status.keys())
		# 	break

	@export
	def get_config(self):
		"""Returns the config dictionary"""
		return self.config.config

	@export
	def save_config(self, config):
		config = arrayify(config)
		# log.info(config)
		# log.info(self.config.config)
		if config == self.config.config: return

		"sets the config dictionary"
		for key in list(config.keys()):
			self.config[key] = config[key]
		self.config.save()

	@export
	def get_conds(self):
		return self.conds.config

	@export
	def save_conds(self, conds):
		conds = arrayify(conds)
		# log.info(conds)
		# log.info(self.conds.config)

		if conds == self.conds.config: return
		log.info('saved')
		for key in conf_keys_to_list(self.conds):
			if not key in list(conds.keys()):
				del self.conds[key]

		for key in list(conds.keys()):
			self.conds[key] = conds[key]
		self.conds.save()

	@export
	def get_rules(self):
		labels = self.get_labels_plus_default()

		to_remove = []
		for key in conf_keys_to_list(self.rules):
			if key not in labels:
				del self.rules[key]


		for key in labels:
			if key not in self.rules:
				self.rules[key] = []

		return self.rules.config

	@export
	def save_rules(self, rules):

		rules = arrayify(rules)

		log.info(rules)
		log.info(self.rules.config)

		# return
		for key in conf_keys_to_list(self.rules):
			if not key in list(rules.keys()):
				del self.rules[key]

		for key in list(rules.keys()):
			self.rules[key] = rules[key]
		self.rules.save()

	@export
	def get_conds_aliases(self):
		rdict = {k:v.desc for k,v in wanted_params.items()}



		return rdict


		# {
		# 	'func_size': 'Size',
		# 	'func_ratio': 'Ratio',
		# 	'func_added': 'Date Added',
		# 	'func_seed_time': 'Seed Time',
		# 	'func_seeders': 'Seeders'
		# }


	@export
	def get_conds_aliases_type(self, key):
		return wanted_params.get(key).types




	def get_labels_plus_default(self):
		if 'Label' in component.get("CorePluginManager").get_enabled_plugins():
			return component.get("CorePlugin.Label").get_labels() + ['all', 'none']
		else:
			return ['all', 'none']
