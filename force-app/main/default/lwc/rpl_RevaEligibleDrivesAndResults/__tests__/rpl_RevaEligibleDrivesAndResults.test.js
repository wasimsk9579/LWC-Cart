import { createElement } from 'lwc';
import Rpl_RevaEligibleDrivesAndResults from 'c/rpl_RevaEligibleDrivesAndResults';

describe('c-rpl-reva-eligible-drives-and-results', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('TODO: test case generated by CLI command, please fill in test logic', () => {
        // Arrange
        const element = createElement('c-rpl-reva-eligible-drives-and-results', {
            is: Rpl_RevaEligibleDrivesAndResults
        });

        // Act
        document.body.appendChild(element);

        // Assert
        // const div = element.shadowRoot.querySelector('div');
        expect(1).toBe(1);
    });
});