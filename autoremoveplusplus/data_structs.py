from dataclasses import dataclass
@dataclass
class paramdata:
	modifier_func: any = None
	stat: str = ""
	desc: str = ""
	types: str = ""

import time

def time_since_added_helper(ntime):
	return second_to_hour(time.time() - ntime)
def no_mod(arg):
	return arg
def byte_to_GiB(byte):
	return byte / 1024 ** 3
def second_to_hour(second):
	return round(second / 3600, 2)

wanted_params = {
	"availability": paramdata(second_to_hour, 'distributed_copies', "Availability", "float"),
	"active_time": paramdata(second_to_hour, 'active_time', "Active Time (h)", "float"),
	"seeding_time": paramdata(second_to_hour, 'seeding_time', "Seeding Time (h)", "float"),
	# "finished_time": paramdata(no_mod, 'finished_time', "Finished Time"),
	"all_time_download": paramdata(byte_to_GiB, 'all_time_download', "All Time Download (GiB)", "float"),
	"is_finished": paramdata(no_mod, 'is_finished', "Is Finished", ["True", "False"]),
	"num_peers": paramdata(no_mod, 'num_peers', "Number of Peers", "int"),
	"num_seeds": paramdata(no_mod, 'num_seeds', "Numbver of Seeds", "int"),
	"paused": paramdata(no_mod, 'paused', "Pasued", ["True", "False"]),
	"progress": paramdata(no_mod, 'progress', "Progress (%)", "float"),
	"shared": paramdata(no_mod, 'shared', "Shared", "float"),
	"seeds_peers_ratio": paramdata(no_mod, 'seeds_peers_ratio', "Seed to Peer Ratio", "float"),
	"state": paramdata(no_mod, 'state', "State", ["Downloading", "Paused", "Seeding"]),
	"time_since_added": paramdata(time_since_added_helper,'time_added', "Time Since Added", "float"),
	"total_done": paramdata(byte_to_GiB, 'total_done', "Total Done (GiB)", "float"),
	"total_peers": paramdata(no_mod, 'total_peers', "Total Peers", "float"),
	"total_seeds": paramdata(no_mod, 'total_seeds', "Total Seeds", "float"),
	"total_uploaded": paramdata(byte_to_GiB, 'total_uploaded', "Total Uploaded (GiB)", "float"),
	"total_wanted": paramdata(byte_to_GiB, 'total_wanted', "Total Wanted (GiB)", "float"),
	"total_remaining": paramdata(byte_to_GiB, 'total_remaining', "Total Remaining (GiB)", "float"),
	# "tracker": paramdata(no_mod, 'tracker', "Tracker"),
	# "tracker_host": paramdata(no_mod, 'tracker_host', "Tracker Host"),
	# "trackers": paramdata(no_mod, 'trackers', "Trackers"),
	"eta": paramdata(second_to_hour, 'eta', "Eta (h)", "float"),
	"ratio": paramdata(no_mod, 'ratio', "Ratio", "float"),
	"last_seen_complete": paramdata(second_to_hour, 'last_seen_complete', "Last seen complete (h)", "float"),
	"time_since_download": paramdata(second_to_hour, 'time_since_download', "Time since download (h)", "float"),
	"time_since_upload": paramdata(second_to_hour, 'time_since_upload', "Time since upload (h)", "float"),
	"time_since_transfer": paramdata(second_to_hour, 'time_since_transfer', "Time since transfer (h)", "float")
	}