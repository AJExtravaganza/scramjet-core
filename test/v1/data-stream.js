const { DataStream, StringStream } = require(process.env.SCRAMJET_TEST_HOME || '../../');
const {PassThrough} = require("stream");

const getStream = (x = 100) => {
    const ret = new DataStream();
    let cnt = 0;
    for (let i = 0; i < x; i++)
        ret.write({val: cnt++});
    process.nextTick(() => ret.end());
    return ret;
};

module.exports = {
    test_when: {
        end(test) {
            test.expect(2);

            let ended = false;
            let notDone = true;

            const stream = getStream().each(a => a);

            stream.on("end", () => {
                ended = true
            });

            (async () => {
                await (stream.whenEnd());
                notDone = false;
                test.ok(ended, "Stream is ended");
                test.done();
            })()
            .catch(
                (err) => {
                    test.ok(false, "Should not throw: " + err.stack)
                }
            )
            ;

            test.ok(notDone, "Does not resolve before the stream ends");
        }
    },
    test_from: {
        async noOptions(test) {
            const x = new PassThrough({objectMode: true});
            x.write(1);
            x.write(2);
            x.end(3);

            const z = await DataStream.from(x)
                .toArray();

            test.deepEqual([1,2,3], z, "Should be the same as the stream");
            test.done();
        },
        async subClass(test) {
            const x = new PassThrough({ objectMode: true });
            x.end("aaa");

            const y = StringStream.from(x);
            const z = await y.toArray();

            test.deepEqual(["aaa"], z, "Should be the same as the stream");
            test.ok(y instanceof StringStream, "Should return the derived class");
            test.done();
        }
    },
    test_options: {
        set(test) {
            const x = new DataStream({test:1});
            test.equals(x._options.test, 1, "Option can be set in constructor");

            x.setOptions({test:2, maxParallel: 17});
            test.equals(x._options.test, 2, "Any option can be set");
            test.equals(x._options.maxParallel, 17, "Default options can be set at any point");

            test.done();
        },
        fromReferrer(test) {
            const x = new DataStream({test:1});
            const y = new DataStream({test:3});

            x.pipe(y);
            x.setOptions({test:2, maxParallel: 17});

            test.equals(y._options.referrer, x, "Referrer is set correctly");
            test.equals(x._options.test, 2, "Any option can be set");
            test.equals(y._options.test, 3, "Own option is always more important than referrer's");
            test.equals(y._options.maxParallel, 17, "Options are passed from referrer even if set after the reference");
            test.done();
        }
    },
    test_while_until: {
        while(test) {
            const str = getStream();
            test.expect(1);

            str.while(
                (data) => data.val < 50
            )
            .toArray()
            .then(
                (data) => {
                    test.equals(data.length, 50, "Must not read beyond last matching item");
                    test.done();
                }
            );
        },
        until(test) {
            const str = getStream();
            test.expect(1);

            str.until(
                (data) => data.val >= 50
            )
            .toArray()
            .then(
                (data) => {
                    test.equals(data.length, 50, "Must not read beyond last not matching item");
                    test.done();
                }
            );
        }
    },
    test_tee: {
        standard(test) {

            test.expect(3);
            const str = getStream();

            str.tee((stream) => {
                test.notEqual(str, stream, "The stream must be a new object");
                test.equals(str.read(), stream.read(), "The stream items must be identical");
                test.ok(stream instanceof DataStream, "Stream has to be a DataStream");
                test.done();
            }).on("error",
                (e) => (console.log(e), test.ok(false, "Should not throw error: " + e))
            );
        },
        extended(test) {

            let cmp = {};
            class NewStream extends DataStream {
                test() {
                    return cmp;
                }
            }

            const org = new NewStream();
            org.tee(
                stream => {
                    test.ok(stream instanceof NewStream, "Returns instance of the Extended class");
                    test.notEqual(stream, org, "Should return a new stream here");
                    test.equals(stream.test(), cmp, "The instance works as it should");
                    test.done();
                }
            );

        }
    },
    test_slice(test) {
        test.ok(true, "Slice is not implemented");
        test.done();
    },
    test_reduce: {
        accumulator_tests(test) {

            test.expect(4);

            let ended = false;
            const ret = getStream()
                .on("end",
                    () => {
                        ended = true;
                    }
                ).reduce(
                    (acc, int) => (acc.sum += int.val, acc.cnt++, acc),
                    {sum: 0, cnt: 0}
                ).then(
                    (acc) => {
                        test.equals(acc.cnt, 100, "The method should get all 100 elements in the stream");
                        test.equals(acc.sum, 4950, "Sum should be equal to the sum of all streamed elements");
                        test.ok(ended, "Stream should end before resolving the promise");
                        test.done();
                    }
                ).catch(
                    (e) => (console.log(e), test.ok(false, "Should not throw error: " + e))
                );

            test.ok(
                ret instanceof Promise,
                "Reduce returns a chainable Promise"
            );

        },
        pass_accumulator_test(test) {
            test.expect(1);

            getStream()
                .reduce(
                    (acc, int) => (acc + int.val),
                    0
                ).then(
                    (acc) => {
                        test.equals(acc, 4950, "Sum should be equal to the sum of all streamed elements");
                        test.done();
                    }
                ).catch(
                    (e) => (console.log(e), test.ok(false, "Should not throw error: " + e))
                );

        }
    },
    test_map(test) {
        test.expect(3);

        let unmapped;

        let mapped = getStream()
            .tee(
                (stream) => unmapped = stream.reduce(
                    (acc, item) => (acc.push(item), acc),
                    []
                )
            )
            .map(
                (item) => {
                    return {
                        even: item.val % 2 === 0,
                        num: item.val
                    };
                }
            )
            .on("error", (e) => test.ok(false, "Should not error " + (e && e.stack)))
            .reduce(
                (acc, item) => (acc.push(item), acc),
                []
            );

        Promise.all([mapped, unmapped])
            .then((args) => {
                const mapped = args[0];
                const unmapped = args[1];

                test.notDeepEqual(mapped[0], unmapped[0], "Mapped stream should emit the mapped objects");
                test.ok(mapped[10].num === unmapped[10].val, "Transform must keep the order");
                test.ok(mapped[2].even && mapped[2].num === 2, "New values must be mapped " + JSON.stringify(mapped[2]));
                test.done();
            }).catch(
                (e) => (console.log(e), test.ok(false, "Should not throw error: " + e))
            );

    },
    test_filter(test) {
        test.expect(4);

        let unfiltered;
        let mergeLeaks = 0;
        const filtered = getStream()
            .tee(
                (stream) => unfiltered = stream.reduce(
                    (acc, item) => (acc.push(item), acc),
                    []
                )
            )
            .filter((item) => item.val % 2 === 0)
            .filter(() => (mergeLeaks++, true))
            .reduce(
                (acc, item) => (acc.push(item), acc),
                []
            );

        Promise.all([filtered, unfiltered])
            .then(
                (args) => {
                    const filtered = args[0];
                    const unfiltered = args[1];

                    test.deepEqual(filtered[1], unfiltered[2], "Even value objects must not be fitered out");
                    test.ok(filtered.indexOf(unfiltered[1]) === -1, "Odd value items must not exist in fitered streams");
                    test.equal(filtered.indexOf(unfiltered[8]), 4, "Every other item should be emitted in order");
                    test.equal(mergeLeaks, 50, "On merged transform following filter the previously filtered elements should not show up");
                    test.done();
                }
            ).catch(
                (e) => (console.log(e), test.ok(false, "Should not throw error: " + e))
            );
    },
    test_from: {
        async array(test) {
            test.expect(1);
            const arr = [1,2,3,4,5,6,7,8,9];
            const str = DataStream.fromArray(arr);
            test.deepEqual(await str.toArray(), arr, 'Should resolve to the same array');
            test.done();
        },
        async iterator(test) {
            test.expect(1);
            const arr = (function* () {
                let i = 1;
                while (i < 10)
                    yield i++;
            })();
            const str = DataStream.fromIterator(arr);
            str.catch(e => {
                console.error(e);
                throw e;
            })
            test.deepEqual(await str.toArray(), [1,2,3,4,5,6,7,8,9], 'Should resolve to the same array');
            test.done();
        },
    },
    test_pipe: {
        pipes(test) {
            test.expect(2);

            const orgStream = new DataStream();
            const pipedStream = (orgStream).pipe(
                new DataStream()
            ).once("data", (chunk) => {
                test.strictEqual(chunk.val, 123, "Chunks should appear on piped stream");
                test.done();
            });
            test.notStrictEqual(orgStream, pipedStream, "Piped stream musn't be the same object");
            orgStream.end({val: 123});
        },
        allows_to_capture(test) {
            test.expect(2);
            let err = new Error("Hello!");
            let err2 = new Error("Hello 2!");

            const orgStream = new DataStream()
                .catch(e => {
                    test.equals(err, e, "Should pass the same error");
                    return Promise.reject(err2);
                });
            ;

            const pipedStream = orgStream.pipe(new DataStream())
                .catch(e => {
                    test.equals(err2, e, "Should pass the error via pipe");
                    orgStream.end({});
                    return true;
                });

            pipedStream.on("error", (e) => {
                test.fail("Caught error should not be thrown");
            });

            pipedStream.on("end", () => test.done());
            orgStream.raise(err);

            pipedStream.resume();
        },
        propagates_errors(test) {
            test.expect(1);

            const orgStream = new DataStream();
            const pipedStream = orgStream.pipe(new DataStream());

            pipedStream.on("error", (e) => {
                test.ok(e instanceof Error, "Pipe should propagate errors");
                test.done();
            });
            orgStream.emit("error", new Error("Hello!"));
        }
    },
    test_mod: {
        async string_arg(test) {
            test.expect(1);

            try {
                const ret = await (
                    DataStream.fromArray([0,1,2,3,4])
                        .use('../lib/modtest')
                        .toArray()
                );
                test.deepEqual(ret, [1,2,3,4,5], "Should identify and load the right module, relative to __dirname");
            } catch(e) {
                test.fail("Should not throw: " + e.stack);
            }

            test.done();
        }
    }
};
