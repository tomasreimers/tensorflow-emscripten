import subprocess
import re
import numpy as np
import sys

if __name__ == "__main__":
    graph_times = []
    main_times = []
    total_times = []

    if len(sys.argv) != 3:
        print "usage: python run_trails.py {mnist,labeler} {c,node,browser}"
        assert False

    for i in xrange(10):
        output = subprocess.check_output("./run_scripts/run_{}_{}.sh {}".format(sys.argv[1], sys.argv[2], i), stderr=subprocess.STDOUT, shell=True)

        main_time_match = re.search("main time ([0-9.]+)s", output)
        main_time = float(main_time_match.group(1))

        graph_time_match = re.search("graph time ([0-9.]+)s", output)
        graph_time = float(graph_time_match.group(1))

        total_time_match = re.search("real\s([0-9.]+)m([0-9.]+)s", output)
        total_time = 60 * float(total_time_match.group(1)) + float(total_time_match.group(2))

        graph_times.append(graph_time)
        main_times.append(main_time)
        total_times.append(total_time)
        print "{} -- total: {}, main: {}, graph: {}".format(i, total_time, main_time, graph_time)

    print "AVERAGE -- total: {}, main: {}, graph: {}".format(np.mean(total_times), np.mean(main_times), np.mean(graph_times))
